import express from 'express';
import * as transactionController from '../controllers/transaction.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, authorizeAdmin, transactionController.getAllTransactions);
router.get('/me', authenticate, transactionController.getCurrentUserTransactions);
router.get('/:id', authenticate, transactionController.getTransactionById);
router.post('/', authenticate, transactionController.createTransaction);

export default router;
