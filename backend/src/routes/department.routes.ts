import express from 'express';
import * as departmentController from '../controllers/department.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, departmentController.getAllDepartments);
router.get('/:id', authenticate, departmentController.getDepartmentById);
router.post('/', authenticate, authorizeAdmin, departmentController.createDepartment);
router.put('/:id', authenticate, authorizeAdmin, departmentController.updateDepartment);
router.delete('/:id', authenticate, authorizeAdmin, departmentController.deleteDepartment);

export default router;
