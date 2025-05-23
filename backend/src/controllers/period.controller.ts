import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllPeriods = async (req: Request, res: Response) => {
  try {
    const periods = await prisma.coinSupplyPeriod.findMany({
      orderBy: {
        startDate: 'desc'
      }
    });
    
    res.json(periods);
  } catch (error) {
    console.error('Get all periods error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentPeriod = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const currentPeriod = await prisma.coinSupplyPeriod.findFirst({
      where: {
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });
    
    if (!currentPeriod) {
      return res.status(404).json({ message: 'No active period found' });
    }
    
    res.json(currentPeriod);
  } catch (error) {
    console.error('Get current period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getPeriodById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const period = await prisma.coinSupplyPeriod.findUnique({
      where: { id }
    });
    
    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    res.json(period);
  } catch (error) {
    console.error('Get period by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createPeriod = async (req: Request, res: Response) => {
  try {
    const { periodName, startDate, endDate, totalSupply } = req.body;
    const userId = req.user?.userId;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    
    const overlappingPeriod = await prisma.coinSupplyPeriod.findFirst({
      where: {
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start }
          },
          {
            startDate: { lte: end },
            endDate: { gte: end }
          },
          {
            startDate: { gte: start },
            endDate: { lte: end }
          }
        ]
      }
    });
    
    if (overlappingPeriod) {
      return res.status(400).json({ 
        message: 'New period overlaps with an existing period',
        overlappingPeriod
      });
    }
    
    const period = await prisma.coinSupplyPeriod.create({
      data: {
        periodName,
        startDate: start,
        endDate: end,
        totalSupply,
        createdById: userId
      }
    });
    
    res.status(201).json(period);
  } catch (error) {
    console.error('Create period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updatePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { periodName, startDate, endDate, totalSupply } = req.body;
    
    const existingPeriod = await prisma.coinSupplyPeriod.findUnique({
      where: { id }
    });
    
    if (!existingPeriod) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    let start = existingPeriod.startDate;
    let end = existingPeriod.endDate;
    
    if (startDate) {
      start = new Date(startDate);
    }
    
    if (endDate) {
      end = new Date(endDate);
    }
    
    if (start >= end) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }
    
    const overlappingPeriod = await prisma.coinSupplyPeriod.findFirst({
      where: {
        id: { not: id },
        OR: [
          {
            startDate: { lte: start },
            endDate: { gte: start }
          },
          {
            startDate: { lte: end },
            endDate: { gte: end }
          },
          {
            startDate: { gte: start },
            endDate: { lte: end }
          }
        ]
      }
    });
    
    if (overlappingPeriod) {
      return res.status(400).json({ 
        message: 'Updated period would overlap with an existing period',
        overlappingPeriod
      });
    }
    
    const period = await prisma.coinSupplyPeriod.update({
      where: { id },
      data: {
        periodName,
        startDate: start,
        endDate: end,
        totalSupply
      }
    });
    
    res.json(period);
  } catch (error) {
    console.error('Update period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deletePeriod = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingPeriod = await prisma.coinSupplyPeriod.findUnique({
      where: { id }
    });
    
    if (!existingPeriod) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    const transactionCount = await prisma.transaction.count({
      where: { periodName: existingPeriod.periodName }
    });
    
    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete period with associated transactions',
        transactionCount
      });
    }
    
    await prisma.coinSupplyPeriod.delete({
      where: { id }
    });
    
    res.json({ message: 'Period deleted successfully' });
  } catch (error) {
    console.error('Delete period error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resetAndAllocateCoins = async (req: Request, res: Response) => {
  try {
    const { periodId } = req.params;
    
    const period = await prisma.coinSupplyPeriod.findUnique({
      where: { id: periodId }
    });
    
    if (!period) {
      return res.status(404).json({ message: 'Period not found' });
    }
    
    const initialAllocationConfig = await prisma.config.findUnique({
      where: { key: 'InitialAllocationPerUser' }
    });
    
    const initialAllocation = parseInt(initialAllocationConfig?.value || '20');
    
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true }
    });
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { isActive: true },
        data: { currentBalance: 0 }
      });
      
      for (const user of activeUsers) {
        await tx.user.update({
          where: { id: user.id },
          data: { currentBalance: initialAllocation }
        });
        
        await tx.periodBalance.create({
          data: {
            userId: user.id,
            periodName: period.periodName,
            balance: initialAllocation,
            snapshotDate: new Date()
          }
        });
      }
      
      await tx.syncLog.create({
        data: {
          jobType: 'QUARTERLY_RESET',
          status: 'SUCCESS',
          rowsProcessed: activeUsers.length,
          details: `Reset and allocated ${initialAllocation} coins to ${activeUsers.length} active users for period ${period.periodName}`
        }
      });
      
      return {
        usersUpdated: activeUsers.length,
        coinsAllocated: activeUsers.length * initialAllocation
      };
    });
    
    res.json({
      message: 'Reset and allocation completed successfully',
      period: period.periodName,
      ...result
    });
  } catch (error) {
    console.error('Reset and allocate coins error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
