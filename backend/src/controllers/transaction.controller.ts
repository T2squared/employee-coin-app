import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../index';

const prisma = new PrismaClient();

export const getAllTransactions = async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '10', senderId, recipientId, startDate, endDate, keyword } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    const where: any = {};
    
    if (senderId) {
      where.senderId = senderId as string;
    }
    
    if (recipientId) {
      where.recipientId = recipientId as string;
    }
    
    if (startDate && endDate) {
      where.transactionTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      where.transactionTime = {
        gte: new Date(startDate as string)
      };
    } else if (endDate) {
      where.transactionTime = {
        lte: new Date(endDate as string)
      };
    }
    
    if (keyword) {
      where.reason = {
        contains: keyword as string,
        mode: 'insensitive'
      };
    }
    
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          transactionTime: 'desc'
        },
        skip,
        take: limitNumber
      }),
      prisma.transaction.count({ where })
    ]);
    
    res.json({
      transactions,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUserTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { page = '1', limit = '10', type, startDate, endDate, keyword } = req.query;
    
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;
    
    const where: any = {};
    
    if (type === 'sent') {
      where.senderId = userId;
    } else if (type === 'received') {
      where.recipientId = userId;
    } else {
      where.OR = [
        { senderId: userId },
        { recipientId: userId }
      ];
    }
    
    if (startDate && endDate) {
      where.transactionTime = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else if (startDate) {
      where.transactionTime = {
        gte: new Date(startDate as string)
      };
    } else if (endDate) {
      where.transactionTime = {
        lte: new Date(endDate as string)
      };
    }
    
    if (keyword) {
      where.reason = {
        contains: keyword as string,
        mode: 'insensitive'
      };
    }
    
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true,
              department: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        },
        orderBy: {
          transactionTime: 'desc'
        },
        skip,
        take: limitNumber
      }),
      prisma.transaction.count({ where })
    ]);
    
    res.json({
      transactions,
      pagination: {
        total: totalCount,
        page: pageNumber,
        limit: limitNumber,
        pages: Math.ceil(totalCount / limitNumber)
      }
    });
  } catch (error) {
    console.error('Get current user transactions error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTransactionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        recipient: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (userRole !== 'ADMIN' && transaction.senderId !== userId && transaction.recipientId !== userId) {
      return res.status(403).json({ message: 'Not authorized to view this transaction' });
    }
    
    res.json(transaction);
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const senderId = req.user?.userId;
    const { recipientId, reason } = req.body;
    
    if (!senderId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (senderId === recipientId) {
      return res.status(400).json({ message: 'Cannot send coins to yourself' });
    }
    
    if (!reason || reason.length < 10 || reason.length > 200) {
      return res.status(400).json({ message: 'Reason must be between 10 and 200 characters' });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const fixedCoinPerTxConfig = await tx.config.findUnique({
        where: { key: 'FixedCoinPerTx' }
      });
      const maxTransactionsPerDayConfig = await tx.config.findUnique({
        where: { key: 'MaxTransactionsPerDay' }
      });
      
      const fixedCoinPerTx = parseInt(fixedCoinPerTxConfig?.value || '3');
      const maxTransactionsPerDay = parseInt(maxTransactionsPerDayConfig?.value || '3');
      
      const sender = await tx.user.findUnique({
        where: { id: senderId }
      });
      
      if (!sender || !sender.isActive) {
        throw new Error('Sender not found or inactive');
      }
      
      if (sender.currentBalance < fixedCoinPerTx) {
        throw new Error('Insufficient balance');
      }
      
      const recipient = await tx.user.findUnique({
        where: { id: recipientId }
      });
      
      if (!recipient || !recipient.isActive) {
        throw new Error('Recipient not found or inactive');
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const transactionsToday = await tx.transaction.count({
        where: {
          senderId,
          transactionTime: {
            gte: today,
            lt: tomorrow
          }
        }
      });
      
      if (transactionsToday >= maxTransactionsPerDay) {
        throw new Error('Daily transaction limit reached');
      }
      
      const currentDate = new Date();
      const currentPeriod = await tx.coinSupplyPeriod.findFirst({
        where: {
          startDate: { lte: currentDate },
          endDate: { gte: currentDate }
        }
      });
      
      const transaction = await tx.transaction.create({
        data: {
          senderId,
          recipientId,
          amount: fixedCoinPerTx,
          reason,
          periodName: currentPeriod?.periodName
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          recipient: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });
      
      await tx.user.update({
        where: { id: senderId },
        data: { currentBalance: { decrement: fixedCoinPerTx } }
      });
      
      await tx.user.update({
        where: { id: recipientId },
        data: { currentBalance: { increment: fixedCoinPerTx } }
      });
      
      return {
        transaction,
        remainingTransactions: maxTransactionsPerDay - (transactionsToday + 1)
      };
    });
    
    if (io) {
      io.to(result.transaction.recipientId).emit('transaction_received', {
        id: result.transaction.id,
        sender: result.transaction.sender,
        amount: result.transaction.amount,
        reason: result.transaction.reason,
        transactionTime: result.transaction.transactionTime
      });
    }
    
    res.status(201).json({
      transaction: result.transaction,
      remainingTransactions: result.remainingTransactions
    });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(400).json({ message: error.message || 'Transaction failed' });
  }
};
