import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllConfig = async (req: Request, res: Response) => {
  try {
    const config = await prisma.config.findMany();
    res.json(config);
  } catch (error) {
    console.error('Get all config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getConfigByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    
    const config = await prisma.config.findUnique({
      where: { key }
    });
    
    if (!config) {
      return res.status(404).json({ message: 'Config not found' });
    }
    
    res.json(config);
  } catch (error) {
    console.error('Get config by key error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateConfig = async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const userId = req.user?.userId;
    
    const existingConfig = await prisma.config.findUnique({
      where: { key }
    });
    
    if (!existingConfig) {
      return res.status(404).json({ message: 'Config not found' });
    }
    
    const config = await prisma.config.update({
      where: { key },
      data: {
        value,
        description,
        updatedById: userId
      }
    });
    
    await prisma.auditLog_AdminAction.create({
      data: {
        adminUserId: userId || '',
        actionType: 'CONFIG_UPDATE',
        targetEntityType: 'Config',
        targetEntityId: key,
        oldValue: existingConfig.value,
        newValue: value,
        ipAddress: req.ip
      }
    });
    
    res.json(config);
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createConfig = async (req: Request, res: Response) => {
  try {
    const { key, value, description } = req.body;
    const userId = req.user?.userId;
    
    const existingConfig = await prisma.config.findUnique({
      where: { key }
    });
    
    if (existingConfig) {
      return res.status(400).json({ message: 'Config already exists' });
    }
    
    const config = await prisma.config.create({
      data: {
        key,
        value,
        description,
        updatedById: userId
      }
    });
    
    await prisma.auditLog_AdminAction.create({
      data: {
        adminUserId: userId || '',
        actionType: 'CONFIG_CREATE',
        targetEntityType: 'Config',
        targetEntityId: key,
        newValue: value,
        ipAddress: req.ip
      }
    });
    
    res.status(201).json(config);
  } catch (error) {
    console.error('Create config error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
