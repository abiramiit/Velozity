import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject } from '../controllers/project.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { projectSchema } from '../utils/validation';
import { Role } from '@prisma/client';

export const projectRouter = Router();

projectRouter.use(requireAuth);

// Only ADMIN and PM can access project routes.
projectRouter.use(requireRole([Role.ADMIN, Role.PROJECT_MANAGER]));

projectRouter.get('/', getProjects);
projectRouter.get('/:id', getProjectById);
projectRouter.post('/', validateRequest(projectSchema), createProject);
projectRouter.patch('/:id', validateRequest(projectSchema), updateProject);
