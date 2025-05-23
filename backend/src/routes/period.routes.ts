import express from 'express';
import * as periodController from '../controllers/period.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, periodController.getAllPeriods);
router.get('/current', authenticate, periodController.getCurrentPeriod);
router.get('/:id', authenticate, periodController.getPeriodById);
router.post('/', authenticate, authorizeAdmin, periodController.createPeriod);
router.put('/:id', authenticate, authorizeAdmin, periodController.updatePeriod);
router.delete('/:id', authenticate, authorizeAdmin, periodController.deletePeriod);
router.post('/:periodId/reset-allocate', authenticate, authorizeAdmin, periodController.resetAndAllocateCoins);

export default router;
