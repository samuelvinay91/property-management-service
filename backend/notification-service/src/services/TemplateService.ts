import Handlebars from 'handlebars';
import Mustache from 'mustache';
import { Liquid } from 'liquidjs';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { NotificationTemplate, TemplateEngine, TemplateStatus, LocalizedContent } from '../entities/NotificationTemplate';
import { Logger } from '../utils/logger';

export interface RenderRequest {
  templateId: string;
  variables: Record<string, any>;
  locale?: string;
  userId?: string;
}

export interface RenderResult {
  subject: string;
  body: string;
  htmlBody?: string;
  preheader?: string;
  metadata?: Record<string, any>;
}

export interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TemplateTestResult {
  success: boolean;
  result?: RenderResult;
  error?: string;
  performance?: {
    renderTime: number;
    memoryUsage: number;
  };
}

export class TemplateService {
  private templateRepository: Repository<NotificationTemplate>;
  private logger: Logger;
  private handlebars: typeof Handlebars;
  private liquid: Liquid;
  private templateCache: Map<string, { template: NotificationTemplate; expires: Date }>;
  private compiledCache: Map<string, { compiled: any; expires: Date }>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(NotificationTemplate);
    this.logger = new Logger('TemplateService');
    this.templateCache = new Map();
    this.compiledCache = new Map();
    
    // Initialize template engines
    this.handlebars = Handlebars.create();
    this.liquid = new Liquid();
    
    this.registerHelpers();
  }

  /**
   * Render a template with variables
   */
  async renderTemplate(templateId: string, variables: Record<string, any>, locale: string = 'en'): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      // Get template from cache or database
      const template = await this.getTemplate(templateId);
      
      if (!template.isActive) {
        throw new Error(`Template ${templateId} is not active`);
      }

      // Get localized content
      const content = template.getContent(locale);
      if (!content) {
        throw new Error(`Template ${templateId} does not support locale ${locale}`);
      }

      // Validate variables
      const validation = template.validateVariables(variables);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Add default variables
      const enrichedVariables = await this.enrichVariables(variables, template, locale);

      // Render based on engine
      const result = await this.renderWithEngine(template.settings.engine, content, enrichedVariables);

      // Track usage
      template.incrementUsage();
      await this.templateRepository.save(template);

      const renderTime = Date.now() - startTime;
      this.logger.info('Template rendered successfully', {
        templateId,
        locale,
        renderTime,
        engine: template.settings.engine
      });

      return result;

    } catch (error) {
      this.logger.error('Template rendering failed', {
        templateId,
        locale,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    // Validate template data
    const validation = await this.validateTemplateData(templateData);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    const template = this.templateRepository.create({
      ...templateData,
      status: TemplateStatus.DRAFT,
      version: 1,
      usageCount: 0
    });

    const savedTemplate = await this.templateRepository.save(template);

    this.logger.info('Template created', {
      templateId: savedTemplate.id,
      name: savedTemplate.name,
      channel: savedTemplate.channel
    });

    return savedTemplate;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(templateId: string, updates: Partial<NotificationTemplate>): Promise<NotificationTemplate> {
    const template = await this.getTemplate(templateId);
    
    // If template is active and has been used, create a new version
    if (template.isActive && template.usageCount > 0) {
      const newVersion = template.createNewVersion();
      Object.assign(newVersion, updates);
      
      const validation = await this.validateTemplateData(newVersion);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      const savedTemplate = await this.templateRepository.save(newVersion);
      
      this.logger.info('New template version created', {
        originalId: templateId,
        newId: savedTemplate.id,
        version: savedTemplate.version
      });

      return savedTemplate;
    } else {
      // Update existing template
      Object.assign(template, updates);
      
      const validation = await this.validateTemplateData(template);
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      const savedTemplate = await this.templateRepository.save(template);
      
      // Clear cache
      this.clearTemplateCache(templateId);
      
      this.logger.info('Template updated', {
        templateId,
        version: savedTemplate.version
      });

      return savedTemplate;
    }
  }

  /**
   * Delete a template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    const template = await this.getTemplate(templateId);
    
    if (template.isActive && template.usageCount > 0) {
      // Archive instead of delete if template has been used
      template.archive();
      await this.templateRepository.save(template);
      
      this.logger.info('Template archived', { templateId });
    } else {
      await this.templateRepository.delete(templateId);
      this.clearTemplateCache(templateId);
      
      this.logger.info('Template deleted', { templateId });
    }
  }

  /**
   * Test a template with sample data
   */
  async testTemplate(templateId: string, variables: Record<string, any>, locale: string = 'en'): Promise<TemplateTestResult> {
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();

    try {
      const result = await this.renderTemplate(templateId, variables, locale);
      
      const renderTime = Date.now() - startTime;
      const memoryUsage = process.memoryUsage().heapUsed - startMemory;

      return {
        success: true,
        result,
        performance: {
          renderTime,
          memoryUsage
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        performance: {
          renderTime: Date.now() - startTime,
          memoryUsage: process.memoryUsage().heapUsed - startMemory
        }
      };
    }
  }

  /**
   * Get template by ID with caching
   */
  private async getTemplate(templateId: string): Promise<NotificationTemplate> {
    // Check cache first
    const cached = this.templateCache.get(templateId);
    if (cached && cached.expires > new Date()) {
      return cached.template;
    }

    // Fetch from database
    const template = await this.templateRepository.findOne({
      where: { id: templateId }
    });

    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Cache for 5 minutes
    this.templateCache.set(templateId, {
      template,
      expires: new Date(Date.now() + 5 * 60 * 1000)
    });

    return template;
  }

  /**
   * Render template content using specified engine
   */
  private async renderWithEngine(engine: TemplateEngine, content: LocalizedContent, variables: Record<string, any>): Promise<RenderResult> {
    const cacheKey = `${engine}-${JSON.stringify(content)}-${Object.keys(variables).join(',')}`;
    
    switch (engine) {
      case TemplateEngine.HANDLEBARS:
        return this.renderHandlebars(content, variables, cacheKey);
      
      case TemplateEngine.MUSTACHE:
        return this.renderMustache(content, variables);
      
      case TemplateEngine.LIQUID:
        return this.renderLiquid(content, variables);
      
      default:
        throw new Error(`Unsupported template engine: ${engine}`);
    }
  }

  /**
   * Render using Handlebars
   */
  private renderHandlebars(content: LocalizedContent, variables: Record<string, any>, cacheKey: string): RenderResult {
    const cached = this.compiledCache.get(cacheKey);
    let compiled = cached?.compiled;

    if (!compiled || (cached && cached.expires < new Date())) {
      compiled = {
        subject: this.handlebars.compile(content.subject),
        body: this.handlebars.compile(content.body),
        htmlBody: content.htmlBody ? this.handlebars.compile(content.htmlBody) : null,
        preheader: content.preheader ? this.handlebars.compile(content.preheader) : null
      };

      // Cache compiled templates for 1 hour
      this.compiledCache.set(cacheKey, {
        compiled,
        expires: new Date(Date.now() + 60 * 60 * 1000)
      });
    }

    return {
      subject: compiled.subject(variables),
      body: compiled.body(variables),
      htmlBody: compiled.htmlBody ? compiled.htmlBody(variables) : undefined,
      preheader: compiled.preheader ? compiled.preheader(variables) : undefined,
      metadata: content.metadata
    };
  }

  /**
   * Render using Mustache
   */
  private renderMustache(content: LocalizedContent, variables: Record<string, any>): RenderResult {
    return {
      subject: Mustache.render(content.subject, variables),
      body: Mustache.render(content.body, variables),
      htmlBody: content.htmlBody ? Mustache.render(content.htmlBody, variables) : undefined,
      preheader: content.preheader ? Mustache.render(content.preheader, variables) : undefined,
      metadata: content.metadata
    };
  }

  /**
   * Render using Liquid
   */
  private async renderLiquid(content: LocalizedContent, variables: Record<string, any>): Promise<RenderResult> {
    const [subject, body, htmlBody, preheader] = await Promise.all([
      this.liquid.parseAndRender(content.subject, variables),
      this.liquid.parseAndRender(content.body, variables),
      content.htmlBody ? this.liquid.parseAndRender(content.htmlBody, variables) : undefined,
      content.preheader ? this.liquid.parseAndRender(content.preheader, variables) : undefined
    ]);

    return {
      subject,
      body,
      htmlBody,
      preheader,
      metadata: content.metadata
    };
  }

  /**
   * Enrich variables with defaults and computed values
   */
  private async enrichVariables(variables: Record<string, any>, template: NotificationTemplate, locale: string): Promise<Record<string, any>> {
    const enriched = { ...variables };

    // Add default values for missing variables
    for (const templateVar of template.variables) {
      if (enriched[templateVar.name] === undefined && templateVar.defaultValue !== undefined) {
        enriched[templateVar.name] = templateVar.defaultValue;
      }
    }

    // Add system variables
    enriched._system = {
      timestamp: new Date().toISOString(),
      locale,
      templateId: template.id,
      templateName: template.name,
      year: new Date().getFullYear(),
      date: new Date().toLocaleDateString(locale),
      time: new Date().toLocaleTimeString(locale)
    };

    // Add unsubscribe link if enabled
    if (template.settings.unsubscribeEnabled && enriched.userId) {
      enriched.unsubscribeUrl = this.generateUnsubscribeUrl(enriched.userId, template.id);
    }

    return enriched;
  }

  /**
   * Validate template data
   */
  private async validateTemplateData(templateData: Partial<NotificationTemplate>): Promise<TemplateValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!templateData.name) {
      errors.push('Template name is required');
    }

    if (!templateData.channel) {
      errors.push('Template channel is required');
    }

    if (!templateData.type) {
      errors.push('Template type is required');
    }

    // Validate content
    if (!templateData.content || Object.keys(templateData.content).length === 0) {
      errors.push('Template content is required');
    } else {
      // Ensure default locale exists
      if (!templateData.content['en']) {
        errors.push('Default locale (en) content is required');
      }

      // Validate each locale's content
      for (const [locale, content] of Object.entries(templateData.content)) {
        if (!content.subject) {
          errors.push(`Subject is required for locale ${locale}`);
        }

        if (!content.body) {
          errors.push(`Body is required for locale ${locale}`);
        }

        // Check for potential template syntax errors
        try {
          if (templateData.settings?.engine === TemplateEngine.HANDLEBARS) {
            this.handlebars.compile(content.subject);
            this.handlebars.compile(content.body);
          }
        } catch (error) {
          errors.push(`Template syntax error in ${locale}: ${error.message}`);
        }
      }
    }

    // Validate variables
    if (templateData.variables) {
      for (const variable of templateData.variables) {
        if (!variable.name) {
          errors.push('Variable name is required');
        }

        if (!variable.type) {
          errors.push(`Variable type is required for ${variable.name}`);
        }

        // Check for naming conflicts with system variables
        if (variable.name.startsWith('_system')) {
          warnings.push(`Variable ${variable.name} conflicts with system variables`);
        }
      }
    }

    // Check for unique name (excluding current template)
    if (templateData.name) {
      const existing = await this.templateRepository.findOne({
        where: { 
          name: templateData.name,
          channel: templateData.channel
        }
      });

      if (existing && existing.id !== templateData.id) {
        errors.push(`Template with name "${templateData.name}" already exists for channel ${templateData.channel}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Date formatting helper
    this.handlebars.registerHelper('formatDate', (date: Date | string, format: string = 'short') => {
      const d = typeof date === 'string' ? new Date(date) : date;
      
      switch (format) {
        case 'short':
          return d.toLocaleDateString();
        case 'long':
          return d.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'iso':
          return d.toISOString();
        default:
          return d.toString();
      }
    });

    // Currency formatting helper
    this.handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency
      }).format(amount);
    });

    // Conditional helper
    this.handlebars.registerHelper('ifEquals', function(arg1: any, arg2: any, options: any) {
      return (arg1 === arg2) ? options.fn(this) : options.inverse(this);
    });

    // Capitalize helper
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    // Truncate helper
    this.handlebars.registerHelper('truncate', (str: string, length: number = 100) => {
      return str.length > length ? str.substring(0, length) + '...' : str;
    });
  }

  /**
   * Generate unsubscribe URL
   */
  private generateUnsubscribeUrl(userId: string, templateId: string): string {
    const baseUrl = process.env.UNSUBSCRIBE_BASE_URL || 'https://api.example.com';
    const token = Buffer.from(`${userId}:${templateId}:${Date.now()}`).toString('base64');
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Clear template cache
   */
  private clearTemplateCache(templateId: string): void {
    this.templateCache.delete(templateId);
    
    // Clear related compiled cache entries
    for (const [key] of this.compiledCache) {
      if (key.includes(templateId)) {
        this.compiledCache.delete(key);
      }
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(templateId: string): Promise<{
    usageCount: number;
    lastUsed: Date | null;
    avgRenderTime: number;
    errorRate: number;
  }> {
    const template = await this.getTemplate(templateId);
    
    // This would typically involve querying delivery logs for more detailed stats
    return {
      usageCount: template.usageCount,
      lastUsed: template.lastUsedAt,
      avgRenderTime: 0, // Would calculate from delivery logs
      errorRate: 0 // Would calculate from delivery logs
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(): void {
    const now = new Date();
    
    for (const [key, value] of this.templateCache) {
      if (value.expires < now) {
        this.templateCache.delete(key);
      }
    }

    for (const [key, value] of this.compiledCache) {
      if (value.expires < now) {
        this.compiledCache.delete(key);
      }
    }

    this.logger.debug('Template cache cleaned up');
  }
}