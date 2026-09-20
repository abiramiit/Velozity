import { Router } from 'express';
import { getClients, createClient } from '../controllers/client.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { clientSchema } from '../utils/validation';
import { Role } from '@prisma/client';

export const clientRouter = Router();

clientRouter.use(requireAuth);
// Only ADMIN and PM can manage clients
clientRouter.use(requireRole([Role.ADMIN, Role.PROJECT_MANAGER]));

clientRouter.get('/', getClients);
clientRouter.post('/', validateRequest(clientSchema), createClient);
