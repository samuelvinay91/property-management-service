import { Repository } from 'typeorm';
import { Asset, AssetStatus, AssetCondition } from '../entities/Asset';
import { WorkOrder } from '../entities/WorkOrder';
import { MaintenanceSchedule } from '../entities/MaintenanceSchedule';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('AssetService');

export class AssetService {
  private assetRepo: Repository<Asset>;
  private workOrderRepo: Repository<WorkOrder>;
  private scheduleRepo: Repository<MaintenanceSchedule>;

  constructor() {
    this.assetRepo = getRepository(Asset);
    this.workOrderRepo = getRepository(WorkOrder);
    this.scheduleRepo = getRepository(MaintenanceSchedule);
  }

  async getStatistics(): Promise<any> {
    try {
      const total = await this.assetRepo.count();
      const active = await this.assetRepo.count({ where: { status: AssetStatus.ACTIVE } });
      return { total, active };
    } catch (error) {
      logger.error('Failed to get asset statistics', { error: error.message });
      return { total: 0, active: 0 };
    }
  }

  async getAssetById(id: string): Promise<Asset | null> {
    try {
      return await this.assetRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get asset', { error: error.message, id });
      throw error;
    }
  }

  async getAssets(propertyId: string, filters?: any): Promise<Asset[]> {
    try {
      const where: any = { propertyId };
      if (filters?.status) {
        where.status = filters.status;
      }
      return await this.assetRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get assets', { error: error.message, propertyId });
      throw error;
    }
  }

  async createAsset(data: any): Promise<Asset> {
    try {
      const asset = this.assetRepo.create({
        ...data,
        status: AssetStatus.ACTIVE,
        condition: AssetCondition.GOOD,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedAsset = await this.assetRepo.save(asset);
      logger.info('Asset created', { assetId: savedAsset.id });
      return savedAsset;
    } catch (error) {
      logger.error('Failed to create asset', { error: error.message });
      throw error;
    }
  }

  async updateAsset(id: string, data: any): Promise<Asset> {
    try {
      const asset = await this.assetRepo.findOne({ where: { id } });
      if (!asset) {
        throw new Error('Asset not found');
      }

      Object.assign(asset, data, { updatedAt: new Date() });
      const updatedAsset = await this.assetRepo.save(asset);
      logger.info('Asset updated', { assetId: id });
      return updatedAsset;
    } catch (error) {
      logger.error('Failed to update asset', { error: error.message, id });
      throw error;
    }
  }

  async updateAssetCondition(id: string, condition: AssetCondition, notes?: string, inspectedBy?: string): Promise<Asset> {
    try {
      const asset = await this.assetRepo.findOne({ where: { id } });
      if (!asset) {
        throw new Error('Asset not found');
      }

      asset.condition = condition;
      asset.lastInspectionDate = new Date();
      asset.updatedAt = new Date();
      if (notes) {
        asset.notes = notes;
      }

      const updatedAsset = await this.assetRepo.save(asset);
      logger.info('Asset condition updated', { assetId: id, condition });
      return updatedAsset;
    } catch (error) {
      logger.error('Failed to update asset condition', { error: error.message, id });
      throw error;
    }
  }

  async generateAssetQRCode(id: string): Promise<string> {
    try {
      const asset = await this.assetRepo.findOne({ where: { id } });
      if (!asset) {
        throw new Error('Asset not found');
      }

      // Generate QR code URL or data
      const qrCodeData = `asset:${id}`;
      asset.qrCode = qrCodeData;
      await this.assetRepo.save(asset);
      
      logger.info('QR code generated for asset', { assetId: id });
      return qrCodeData;
    } catch (error) {
      logger.error('Failed to generate QR code', { error: error.message, id });
      throw error;
    }
  }

  async getAssetMaintenanceHistory(id: string): Promise<WorkOrder[]> {
    try {
      return await this.workOrderRepo.find({ 
        where: { assetId: id },
        order: { createdAt: 'DESC' }
      });
    } catch (error) {
      logger.error('Failed to get asset maintenance history', { error: error.message, id });
      throw error;
    }
  }

  async getAssetDashboard(propertyIds: string[]): Promise<any> {
    try {
      const totalAssets = await this.assetRepo.count();
      const criticalAssets = await this.assetRepo.count({ 
        where: { condition: AssetCondition.CRITICAL } 
      });

      return {
        totalAssets,
        assetsByCategory: [],
        assetsByCondition: [
          { condition: 'CRITICAL', count: criticalAssets }
        ],
        assetsNeedingMaintenance: 0,
        warrantiesExpiring: 0,
        criticalAssets,
        averageAssetAge: 0,
        totalAssetValue: 0
      };
    } catch (error) {
      logger.error('Failed to get asset dashboard', { error: error.message });
      throw error;
    }
  }

  async updateAssetConditions(): Promise<void> {
    try {
      logger.info('Updating asset conditions');
      // Implementation for updating asset conditions based on maintenance history
    } catch (error) {
      logger.error('Failed to update asset conditions', { error: error.message });
      throw error;
    }
  }
}