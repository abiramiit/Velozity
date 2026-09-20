import { Router } from 'express';
import { getUsers, createUser, getTeam } from '../controllers/user.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { userSchema } from '../utils/validation';
import { Role } from '@prisma/client';

export const userRouter = Router();

userRouter.use(requireAuth);
userRouter.get('/team', requireRole([Role.ADMIN, Role.PROJECT_MANAGER]), getTeam);
userRouter.get('/', requireRole([Role.ADMIN]), getUsers);
userRouter.post('/', requireRole([Role.ADMIN]), validateRequest(userSchema), createUser);
