import { z } from 'zod';
import { TaskStatus, Priority, Role } from '@prisma/client';

export const userSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
        role: z.nativeEnum(Role)
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const clientSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required')
    })
});

export const projectSchema = z.object({
    body: z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        clientId: z.string().uuid('Invalid client ID'),
        createdById: z.string().uuid('Invalid manager ID').optional()
    })
});

export const taskSchema = z.object({
    body: z.object({
        title: z.string().min(1, 'Title is required'),
        description: z.string().optional(),
        projectId: z.string().uuid('Invalid project ID'),
        assignedDeveloperId: z.string().uuid().optional().nullable(),
        priority: z.nativeEnum(Priority).optional(),
        dueDate: z.string().datetime().optional().nullable(),
    })
});

export const taskStatusSchema = z.object({
    body: z.object({
        status: z.nativeEnum(TaskStatus)
    })
});
