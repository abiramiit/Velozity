"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientRouter = void 0;
const express_1 = require("express");
const client_controller_1 = require("../controllers/client.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
exports.clientRouter = (0, express_1.Router)();
exports.clientRouter.use(auth_middleware_1.requireAuth);
// Only ADMIN and PM can manage clients
exports.clientRouter.use((0, auth_middleware_1.requireRole)([client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER]));
exports.clientRouter.get('/', client_controller_1.getClients);
exports.clientRouter.post('/', (0, validate_middleware_1.validateRequest)(validation_1.clientSchema), client_controller_1.createClient);
