import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Notification, NotificationChannel, NotificationType } from './Notification';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum TemplateEngine {
  HANDLEBARS = 'handlebars',
  MUSTACHE = 'mustache',
  LIQUID = 'liquid'
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object';
  required: boolean;
  defaultValue?: any;
  description?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    enum?: string[];
  };
}

export interface LocalizedContent {
  subject: string;
  body: string;
  htmlBody?: string;
  preheader?: string; // For email previews
  metadata?: Record<string, any>;
}

export interface TemplateSettings {
  engine: TemplateEngine;
  enableHtml: boolean;
  enablePreheader: boolean;
  trackOpens: boolean;
  trackClicks: boolean;
  unsubscribeLink: boolean;
  customHeaders?: Record<string, string>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

@Entity('notification_templates')
@Index(['name', 'channel'])
@Index(['type', 'status'])
@Index(['isDefault'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  displayName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'enum', enum: TemplateStatus, default: TemplateStatus.DRAFT })
  status: TemplateStatus;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  category?: string;

  @Column({ type: 'json' })
  variables: TemplateVariable[];

  @Column({ type: 'json' })
  content: Record<string, LocalizedContent>; // locale -> content

  @Column({ type: 'json' })
  settings: TemplateSettings;

  @Column({ type: 'int', default: 1 })
  version: number;

  @Column({ type: 'uuid', nullable: true })
  parentTemplateId?: string; // For template versioning

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromEmail?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fromName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  replyTo?: string;

  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt?: Date;

  @OneToMany(() => Notification, notification => notification.template)
  notifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy?: string;

  // Statistics (could be moved to separate table for better performance)
  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt?: Date;

  // Computed properties
  get isActive(): boolean {
    return this.status === TemplateStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this.status === TemplateStatus.DRAFT;
  }

  get isPublished(): boolean {
    return this.publishedAt !== null;
  }

  get supportedLocales(): string[] {
    return Object.keys(this.content);
  }

  // Helper methods
  getContent(locale: string = 'en'): LocalizedContent | null {
    return this.content[locale] || this.content['en'] || null;
  }

  hasLocale(locale: string): boolean {
    return this.content.hasOwnProperty(locale);
  }

  addLocale(locale: string, content: LocalizedContent): void {
    this.content = {
      ...this.content,
      [locale]: content
    };
  }

  removeLocale(locale: string): void {
    if (locale === 'en') {
      throw new Error('Cannot remove default locale (en)');
    }
    
    const { [locale]: removed, ...rest } = this.content;
    this.content = rest;
  }

  validateVariables(variables: Record<string, any>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const templateVar of this.variables) {
      const value = variables[templateVar.name];

      // Check required variables
      if (templateVar.required && (value === undefined || value === null)) {
        errors.push(`Required variable '${templateVar.name}' is missing`);
        continue;
      }

      // Skip validation if variable is not provided and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (templateVar.type === 'date' && !(value instanceof Date) && !Date.parse(value)) {
        errors.push(`Variable '${templateVar.name}' must be a valid date`);
      } else if (templateVar.type === 'object' && actualType !== 'object') {
        errors.push(`Variable '${templateVar.name}' must be an object`);
      } else if (templateVar.type !== 'object' && templateVar.type !== 'date' && actualType !== templateVar.type) {
        errors.push(`Variable '${templateVar.name}' must be of type ${templateVar.type}`);
      }

      // Additional validation
      if (templateVar.validation) {
        const validation = templateVar.validation;

        if (validation.min !== undefined && typeof value === 'number' && value < validation.min) {
          errors.push(`Variable '${templateVar.name}' must be at least ${validation.min}`);
        }

        if (validation.max !== undefined && typeof value === 'number' && value > validation.max) {
          errors.push(`Variable '${templateVar.name}' must be at most ${validation.max}`);
        }

        if (validation.pattern && typeof value === 'string' && !new RegExp(validation.pattern).test(value)) {
          errors.push(`Variable '${templateVar.name}' does not match required pattern`);
        }

        if (validation.enum && !validation.enum.includes(value)) {
          errors.push(`Variable '${templateVar.name}' must be one of: ${validation.enum.join(', ')}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  publish(): void {
    this.status = TemplateStatus.ACTIVE;
    this.publishedAt = new Date();
  }

  archive(): void {
    this.status = TemplateStatus.ARCHIVED;
    this.archivedAt = new Date();
  }

  incrementUsage(): void {
    this.usageCount++;
    this.lastUsedAt = new Date();
  }

  createNewVersion(): NotificationTemplate {
    const newTemplate = Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    newTemplate.id = undefined;
    newTemplate.version = this.version + 1;
    newTemplate.parentTemplateId = this.id;
    newTemplate.status = TemplateStatus.DRAFT;
    newTemplate.publishedAt = null;
    newTemplate.createdAt = undefined;
    newTemplate.updatedAt = undefined;
    newTemplate.usageCount = 0;
    newTemplate.lastUsedAt = null;
    
    return newTemplate;
  }
}