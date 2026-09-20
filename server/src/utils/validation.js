"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.taskStatusSchema = exports.taskSchema = exports.projectSchema = exports.clientSchema = exports.loginSchema = exports.userSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.userSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email format'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: zod_1.z.nativeEnum(client_1.Role)
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.clientSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required')
    })
});
exports.projectSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        description: zod_1.z.string().optional(),
        clientId: zod_1.z.string().uuid('Invalid client ID'),
        createdById: zod_1.z.string().uuid('Invalid manager ID').optional()
    })
});
exports.taskSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, 'Title is required'),
        description: zod_1.z.string().optional(),
        projectId: zod_1.z.string().uuid('Invalid project ID'),
        assignedDeveloperId: zod_1.z.string().uuid().optional().nullable(),
        priority: zod_1.z.nativeEnum(client_1.Priority).optional(),
        dueDate: zod_1.z.string().datetime().optional().nullable(),
    })
});
exports.taskStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.TaskStatus)
    })
});
