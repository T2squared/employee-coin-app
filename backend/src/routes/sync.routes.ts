import express from 'express';
import * as syncController from '../controllers/sync.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/logs', authenticate, authorizeAdmin, syncController.getSyncLogs);
router.get('/logs/:id', authenticate, authorizeAdmin, syncController.getSyncLogById);
router.post('/export', authenticate, authorizeAdmin, syncController.triggerExport);
router.post('/import', authenticate, authorizeAdmin, syncController.triggerImport);

export default router;
