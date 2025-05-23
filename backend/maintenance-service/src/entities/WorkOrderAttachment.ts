import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Field, ObjectType, ID, registerEnumType } from 'type-graphql';
import { WorkOrder } from './WorkOrder';

export enum AttachmentType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO'
}

export enum AttachmentCategory {
  BEFORE = 'BEFORE',
  DURING = 'DURING',
  AFTER = 'AFTER',
  REFERENCE = 'REFERENCE',
  RECEIPT = 'RECEIPT',
  INVOICE = 'INVOICE',
  MANUAL = 'MANUAL',
  OTHER = 'OTHER'
}

registerEnumType(AttachmentType, { name: 'AttachmentType' });
registerEnumType(AttachmentCategory, { name: 'AttachmentCategory' });

@Entity('work_order_attachments')
@ObjectType()
export class WorkOrderAttachment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => WorkOrder)
  @ManyToOne(() => WorkOrder, workOrder => workOrder.attachments)
  @JoinColumn({ name: 'workOrderId' })
  workOrder: WorkOrder;

  @Field()
  @Column()
  workOrderId: string;

  @Field()
  @Column()
  filename: string;

  @Field()
  @Column()
  originalFilename: string;

  @Field()
  @Column()
  url: string;

  @Field(() => AttachmentType)
  @Column({
    type: 'enum',
    enum: AttachmentType
  })
  type: AttachmentType;

  @Field(() => AttachmentCategory)
  @Column({
    type: 'enum',
    enum: AttachmentCategory,
    default: AttachmentCategory.OTHER
  })
  category: AttachmentCategory;

  @Field()
  @Column()
  mimeType: string;

  @Field()
  @Column({ type: 'bigint' })
  fileSize: number;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  caption?: string;

  @Field()
  @Column()
  uploadedBy: string; // User ID

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Image EXIF, video duration, etc.

  @Field({ nullable: true })
  @Column({ nullable: true })
  thumbnailUrl?: string;

  @Field()
  @Column({ default: true })
  isVisible: boolean; // For tenant/public visibility

  @Field()
  @Column({ default: false })
  isPrivate: boolean; // Internal use only

  @Field({ nullable: true })
  @Column({ type: 'json', nullable: true })
  geoLocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  takenAt?: Date; // When photo/video was taken

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}