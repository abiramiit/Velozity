import { Router } from 'express';
import { getRecentActivity } from '../controllers/activity.controller';
import { requireAuth } from '../middleware/auth.middleware';

export const activityRouter = Router();

activityRouter.use(requireAuth);
activityRouter.get('/', getRecentActivity);
