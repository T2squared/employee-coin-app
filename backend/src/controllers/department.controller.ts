import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        parentDepartment: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    res.json(departments);
  } catch (error) {
    console.error('Get all departments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        parentDepartment: {
          select: {
            id: true,
            name: true
          }
        },
        childDepartments: {
          select: {
            id: true,
            name: true
          }
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    res.json(department);
  } catch (error) {
    console.error('Get department by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, parentDepartmentId } = req.body;
    
    const existingDepartment = await prisma.department.findUnique({ where: { name } });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department with this name already exists' });
    }
    
    const department = await prisma.department.create({
      data: {
        name,
        parentDepartmentId
      }
    });
    
    res.status(201).json(department);
  } catch (error) {
    console.error('Create department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, parentDepartmentId } = req.body;
    
    const existingDepartment = await prisma.department.findUnique({ where: { id } });
    if (!existingDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    if (parentDepartmentId === id) {
      return res.status(400).json({ message: 'Department cannot be its own parent' });
    }
    
    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        parentDepartmentId
      }
    });
    
    res.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const existingDepartment = await prisma.department.findUnique({ 
      where: { id },
      include: {
        users: true,
        childDepartments: true
      }
    });
    
    if (!existingDepartment) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    if (existingDepartment.users.length > 0) {
      return res.status(400).json({ message: 'Cannot delete department with assigned users' });
    }
    
    if (existingDepartment.childDepartments.length > 0) {
      return res.status(400).json({ message: 'Cannot delete department with child departments' });
    }
    
    await prisma.department.delete({ where: { id } });
    
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Delete department error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
