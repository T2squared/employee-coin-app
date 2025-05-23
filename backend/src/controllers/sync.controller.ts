import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { exportDataToSheets, importUsersFromSheets } from '../services/sheets.service';

const prisma = new PrismaClient();

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', jobType } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    const where: any = {};
    
    if (jobType) {
      where.jobType = jobType;
    }
    
    const [logs, totalCount] = await Promise.all([
      prisma.syncLog.findMany({
        where,
        orderBy: {
          runAt: 'desc'
        },
        skip,
        take: limitNumber
      }),
      prisma.syncLog.count({ where })
    ]);
    
    res.json({
      logs,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getSyncLogById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const log = await prisma.syncLog.findUnique({
      where: { id }
    });
    
    if (!log) {
      return res.status(404).json({ message: 'Sync log not found' });
    }
    
    res.json(log);
  } catch (error) {
    console.error('Get sync log by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const triggerExport = async (req: Request, res: Response) => {
  try {
    const result = await exportDataToSheets();
    
    res.json(result);
  } catch (error: any) {
    console.error('Trigger export error:', error);
    res.status(500).json({ 
      message: 'Export failed', 
      error: error.message 
    });
  }
};

export const triggerImport = async (req: Request, res: Response) => {
  try {
    const result = await importUsersFromSheets();
    
    res.json(result);
  } catch (error: any) {
    console.error('Trigger import error:', error);
    res.status(500).json({ 
      message: 'Import failed', 
      error: error.message 
    });
  }
};
