import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTask, updateTaskStatus } from '../controllers/task.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { taskSchema, taskStatusSchema } from '../utils/validation';
import { Role } from '@prisma/client';

export const taskRouter = Router();

taskRouter.use(requireAuth);

// Everyone can view their tasks (filtered in controller)
taskRouter.get('/', getTasks);
taskRouter.get('/:id', getTaskById);

// Devs can update status of their tasks
taskRouter.patch('/:id/status', validateRequest(taskStatusSchema), updateTaskStatus);

// Only ADMIN and PM can create/fully update tasks
taskRouter.post('/', requireRole([Role.ADMIN, Role.PROJECT_MANAGER]), validateRequest(taskSchema), createTask);
taskRouter.patch('/:id', requireRole([Role.ADMIN, Role.PROJECT_MANAGER]), validateRequest(taskSchema), updateTask);
