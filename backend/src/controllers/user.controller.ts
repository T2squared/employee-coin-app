import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true
          }
        },
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true
          }
        },
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, departmentId } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || 'EMPLOYEE',
        departmentId,
        currentBalance: 0,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, isActive, currentBalance } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        departmentId,
        isActive,
        currentBalance
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true
          }
        },
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deactivateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        isActive: false
      }
    });
    
    res.json({ message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true
          }
        },
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const { name, email, currentPassword, newPassword } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    if (currentPassword && newPassword) {
      const isPasswordValid = await bcrypt.compare(currentPassword, existingUser.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        departmentId: true,
        department: {
          select: {
            name: true
          }
        },
        currentBalance: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Update current user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
