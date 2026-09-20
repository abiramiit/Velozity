import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getClients = asyncHandler(async (req: AuthRequest, res: Response) => {
    const clients = await prisma.client.findMany({
        orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: clients });
});

export const createClient = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    const client = await prisma.client.create({ data: { name } });
    res.status(201).json({ success: true, data: client });
});
