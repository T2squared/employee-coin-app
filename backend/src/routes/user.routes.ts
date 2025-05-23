import express from 'express';
import * as userController from '../controllers/user.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, authorizeAdmin, userController.getAllUsers);
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, userController.updateCurrentUser);
router.get('/:id', authenticate, userController.getUserById);
router.post('/', authenticate, authorizeAdmin, userController.createUser);
router.put('/:id', authenticate, authorizeAdmin, userController.updateUser);
router.delete('/:id', authenticate, authorizeAdmin, userController.deactivateUser);

export default router;
