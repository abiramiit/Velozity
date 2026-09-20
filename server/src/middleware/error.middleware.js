"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFound = void 0;
const zod_1 = require("zod");
const notFound = (req, res, next) => {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Not Found - ${req.originalUrl}` } });
};
exports.notFound = notFound;
const errorHandler = (err, req, res, next) => {
    if (err instanceof zod_1.ZodError) {
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
exports.errorHandler = errorHandler;
