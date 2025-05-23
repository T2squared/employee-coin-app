import express from 'express';
import * as authController from '../controllers/auth.controller';

const router = express.Router();

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/reset-password', authController.resetPasswordRequest);
router.post('/reset-password/:token', authController.resetPassword);

export default router;
