import express from 'express';
import * as configController from '../controllers/config.controller';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';

const router = express.Router();

router.get('/', authenticate, configController.getAllConfig);
router.get('/:key', authenticate, configController.getConfigByKey);
router.put('/:key', authenticate, authorizeAdmin, configController.updateConfig);
router.post('/', authenticate, authorizeAdmin, configController.createConfig);

export default router;
