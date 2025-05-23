import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Property } from './Property';

export enum ImageType {
  EXTERIOR = 'EXTERIOR',
  INTERIOR = 'INTERIOR',
  KITCHEN = 'KITCHEN',
  BATHROOM = 'BATHROOM',
  BEDROOM = 'BEDROOM',
  LIVING_ROOM = 'LIVING_ROOM',
  DINING_ROOM = 'DINING_ROOM',
  GARAGE = 'GARAGE',
  YARD = 'YARD',
  AMENITY = 'AMENITY',
  FLOOR_PLAN = 'FLOOR_PLAN',
  OTHER = 'OTHER'
}

@Entity('property_images')
@Index(['propertyId'])
@Index(['isPrimary'])
export class PropertyImage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  propertyId: string;

  @ManyToOne(() => Property, property => property.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'propertyId' })
  property: Property;

  @Column()
  url: string;

  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Column({ nullable: true })
  originalFilename?: string;

  @Column({ nullable: true })
  alt?: string;

  @Column({ nullable: true })
  caption?: string;

  @Column({
    type: 'enum',
    enum: ImageType,
    default: ImageType.INTERIOR
  })
  type: ImageType;

  @Column('int', { default: 0 })
  sortOrder: number;

  @Column({ default: false })
  isPrimary: boolean;

  @Column({ default: true })
  isPublic: boolean;

  // Image metadata
  @Column('int', { nullable: true })
  width?: number;

  @Column('int', { nullable: true })
  height?: number;

  @Column('int', { nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  uploadedBy?: string; // User ID who uploaded

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get aspectRatio(): number | null {
    if (!this.width || !this.height) return null;
    return this.width / this.height;
  }

  get isLandscape(): boolean {
    if (!this.width || !this.height) return false;
    return this.width > this.height;
  }

  get isPortrait(): boolean {
    if (!this.width || !this.height) return false;
    return this.height > this.width;
  }

  get fileSizeFormatted(): string {
    if (!this.fileSize) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(this.fileSize) / Math.log(1024));
    return Math.round(this.fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}