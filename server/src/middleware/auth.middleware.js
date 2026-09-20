"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
exports.requireAuth = (0, express_async_handler_1.default)(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        res.status(401);
        throw Object.assign(new Error('Not authorized, no token'), { code: 'UNAUTHORIZED' });
    }
    try {
        const decoded = (0, jwt_util_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401);
        throw Object.assign(new Error('Not authorized, token failed'), { code: 'UNAUTHORIZED' });
    }
});
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            res.status(403);
            next(Object.assign(new Error('Forbidden: Insufficient permissions'), { code: 'FORBIDDEN' }));
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
