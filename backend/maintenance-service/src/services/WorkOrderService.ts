import { Repository } from 'typeorm';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderType } from '../entities/WorkOrder';
import { Expense } from '../entities/Expense';
import { WorkOrderAttachment } from '../entities/WorkOrderAttachment';
import { getRepository } from '../config/database';
import { Logger } from '../utils/logger';

const logger = new Logger('WorkOrderService');

export class WorkOrderService {
  private workOrderRepo: Repository<WorkOrder>;
  private expenseRepo: Repository<Expense>;
  private attachmentRepo: Repository<WorkOrderAttachment>;

  constructor() {
    this.workOrderRepo = getRepository(WorkOrder);
    this.expenseRepo = getRepository(Expense);
    this.attachmentRepo = getRepository(WorkOrderAttachment);
  }

  async getStatistics(): Promise<any> {
    try {
      const total = await this.workOrderRepo.count();
      const pending = await this.workOrderRepo.count({ where: { status: WorkOrderStatus.PENDING } });
      return { total, pending };
    } catch (error) {
      logger.error('Failed to get work order statistics', { error: error.message });
      return { total: 0, pending: 0 };
    }
  }

  async createWorkOrder(data: any): Promise<WorkOrder> {
    try {
      const workOrder = this.workOrderRepo.create({
        ...data,
        status: WorkOrderStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedWorkOrder = await this.workOrderRepo.save(workOrder);
      logger.info('Work order created', { workOrderId: savedWorkOrder.id });
      return savedWorkOrder;
    } catch (error) {
      logger.error('Failed to create work order', { error: error.message });
      throw error;
    }
  }

  async getWorkOrderById(id: string): Promise<WorkOrder | null> {
    try {
      return await this.workOrderRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get work order', { error: error.message, id });
      throw error;
    }
  }

  async getWorkOrders(propertyId: string, filters?: any): Promise<WorkOrder[]> {
    try {
      const where: any = { propertyId };
      if (filters?.status) {
        where.status = filters.status;
      }
      return await this.workOrderRepo.find({ where });
    } catch (error) {
      logger.error('Failed to get work orders', { error: error.message, propertyId });
      throw error;
    }
  }

  async getOverdueWorkOrders(propertyIds: string[]): Promise<WorkOrder[]> {
    try {
      return await this.workOrderRepo.find({
        where: {
          status: WorkOrderStatus.ASSIGNED,
          scheduledDate: new Date() // This should be a proper date comparison
        }
      });
    } catch (error) {
      logger.error('Failed to get overdue work orders', { error: error.message });
      throw error;
    }
  }

  async updateWorkOrder(id: string, data: any, updatedBy: string): Promise<WorkOrder> {
    try {
      const workOrder = await this.workOrderRepo.findOne({ where: { id } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      Object.assign(workOrder, data, { updatedAt: new Date() });
      const updatedWorkOrder = await this.workOrderRepo.save(workOrder);
      logger.info('Work order updated', { workOrderId: id });
      return updatedWorkOrder;
    } catch (error) {
      logger.error('Failed to update work order', { error: error.message, id });
      throw error;
    }
  }

  async assignWorkOrder(id: string, assigneeId: string, assignedBy: string): Promise<WorkOrder> {
    try {
      const workOrder = await this.workOrderRepo.findOne({ where: { id } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      workOrder.assignedTo = assigneeId;
      workOrder.status = WorkOrderStatus.ASSIGNED;
      workOrder.updatedAt = new Date();

      const updatedWorkOrder = await this.workOrderRepo.save(workOrder);
      logger.info('Work order assigned', { workOrderId: id, assigneeId });
      return updatedWorkOrder;
    } catch (error) {
      logger.error('Failed to assign work order', { error: error.message, id });
      throw error;
    }
  }

  async startWorkOrder(id: string, startedBy: string): Promise<WorkOrder> {
    try {
      const workOrder = await this.workOrderRepo.findOne({ where: { id } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      workOrder.status = WorkOrderStatus.IN_PROGRESS;
      workOrder.startedAt = new Date();
      workOrder.updatedAt = new Date();

      const updatedWorkOrder = await this.workOrderRepo.save(workOrder);
      logger.info('Work order started', { workOrderId: id });
      return updatedWorkOrder;
    } catch (error) {
      logger.error('Failed to start work order', { error: error.message, id });
      throw error;
    }
  }

  async completeWorkOrder(id: string, data: any): Promise<WorkOrder> {
    try {
      const workOrder = await this.workOrderRepo.findOne({ where: { id } });
      if (!workOrder) {
        throw new Error('Work order not found');
      }

      workOrder.status = WorkOrderStatus.COMPLETED;
      workOrder.completedAt = new Date();
      workOrder.updatedAt = new Date();
      workOrder.completionNotes = data.completionNotes;
      workOrder.actualHours = data.actualHours;
      workOrder.actualCost = data.actualCost;

      const updatedWorkOrder = await this.workOrderRepo.save(workOrder);
      logger.info('Work order completed', { workOrderId: id });
      return updatedWorkOrder;
    } catch (error) {
      logger.error('Failed to complete work order', { error: error.message, id });
      throw error;
    }
  }

  async bulkUpdateWorkOrders(ids: string[], updates: any, updatedBy: string): Promise<WorkOrder[]> {
    try {
      const workOrders = await this.workOrderRepo.findByIds(ids);
      const updatedWorkOrders = workOrders.map(wo => {
        Object.assign(wo, updates, { updatedAt: new Date() });
        return wo;
      });

      const savedWorkOrders = await this.workOrderRepo.save(updatedWorkOrders);
      logger.info('Work orders bulk updated', { count: ids.length });
      return savedWorkOrders;
    } catch (error) {
      logger.error('Failed to bulk update work orders', { error: error.message });
      throw error;
    }
  }

  async checkOverdueWorkOrders(): Promise<void> {
    try {
      logger.info('Checking overdue work orders');
      // Implementation for checking overdue work orders
    } catch (error) {
      logger.error('Failed to check overdue work orders', { error: error.message });
      throw error;
    }
  }

  // Expense methods
  async getExpenseById(id: string): Promise<Expense | null> {
    try {
      return await this.expenseRepo.findOne({ where: { id } });
    } catch (error) {
      logger.error('Failed to get expense', { error: error.message, id });
      throw error;
    }
  }

  async getWorkOrderExpenses(workOrderId: string): Promise<Expense[]> {
    try {
      return await this.expenseRepo.find({ where: { workOrderId } });
    } catch (error) {
      logger.error('Failed to get work order expenses', { error: error.message, workOrderId });
      throw error;
    }
  }

  async addExpense(data: any): Promise<Expense> {
    try {
      const expense = this.expenseRepo.create({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedExpense = await this.expenseRepo.save(expense);
      logger.info('Expense added', { expenseId: savedExpense.id });
      return savedExpense;
    } catch (error) {
      logger.error('Failed to add expense', { error: error.message });
      throw error;
    }
  }

  async approveExpense(id: string, approvedBy: string): Promise<Expense> {
    try {
      const expense = await this.expenseRepo.findOne({ where: { id } });
      if (!expense) {
        throw new Error('Expense not found');
      }

      expense.approvedBy = approvedBy;
      expense.approvedAt = new Date();
      expense.updatedAt = new Date();

      const updatedExpense = await this.expenseRepo.save(expense);
      logger.info('Expense approved', { expenseId: id });
      return updatedExpense;
    } catch (error) {
      logger.error('Failed to approve expense', { error: error.message, id });
      throw error;
    }
  }

  async rejectExpense(id: string, reason: string, rejectedBy: string): Promise<Expense> {
    try {
      const expense = await this.expenseRepo.findOne({ where: { id } });
      if (!expense) {
        throw new Error('Expense not found');
      }

      expense.rejectionReason = reason;
      expense.updatedAt = new Date();

      const updatedExpense = await this.expenseRepo.save(expense);
      logger.info('Expense rejected', { expenseId: id });
      return updatedExpense;
    } catch (error) {
      logger.error('Failed to reject expense', { error: error.message, id });
      throw error;
    }
  }

  // Placeholder methods for relationship queries
  async getWorkOrdersByMaintenanceRequest(maintenanceRequestId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepo.find({ where: { maintenanceRequestId } });
  }

  async getWorkOrdersByVendor(vendorId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepo.find({ where: { vendorId } });
  }

  async getWorkOrdersByAsset(assetId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepo.find({ where: { assetId } });
  }

  async getWorkOrdersByInspection(inspectionId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepo.find({ where: { inspectionId: inspectionId } });
  }

  async getWorkOrdersBySchedule(scheduleId: string): Promise<WorkOrder[]> {
    return await this.workOrderRepo.find({ where: { scheduleId: scheduleId } });
  }
}