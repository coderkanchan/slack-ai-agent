import { Router } from 'express';
import { getDashboardAnalytics, updateTaskStatus } from '../controllers/dashboardController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { analyticsQuerySchema, updateTaskStatusSchema } from '../validators/dashboardValidator.js';

const router = Router();

router.get('/analytics', validateRequest(analyticsQuerySchema), getDashboardAnalytics);

//router.put('/update-status', validateRequest(updateTaskStatusSchema), updateTaskStatus);
router.post('/resolve/:id', updateTaskStatus);

export default router;