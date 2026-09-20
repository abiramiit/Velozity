import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Not Found - ${req.originalUrl}` } });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof ZodError) {
        res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid input data', details: err.errors }
        });
        return;
    }

    const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
    res.status(statusCode > 399 ? statusCode : 500).json({
        success: false,
        error: {
            code: err.code || 'INTERNAL_SERVER_ERROR',
            message: err.message || 'An unexpected error occurred',
        }
    });
};
