import { Router } from 'express';
import { getDashboardAnalytics } from '../controllers/dashboardController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { analyticsQuerySchema } from '../validators/dashboardValidator.js';

const router = Router();

router.get('/analytics', validateRequest(analyticsQuerySchema), getDashboardAnalytics);

export default router;