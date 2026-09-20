"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.projectRouter = void 0;
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const validate_middleware_1 = require("../middleware/validate.middleware");
const validation_1 = require("../utils/validation");
const client_1 = require("@prisma/client");
exports.projectRouter = (0, express_1.Router)();
exports.projectRouter.use(auth_middleware_1.requireAuth);
// Only ADMIN and PM can access project routes.
exports.projectRouter.use((0, auth_middleware_1.requireRole)([client_1.Role.ADMIN, client_1.Role.PROJECT_MANAGER]));
exports.projectRouter.get('/', project_controller_1.getProjects);
exports.projectRouter.get('/:id', project_controller_1.getProjectById);
exports.projectRouter.post('/', (0, validate_middleware_1.validateRequest)(validation_1.projectSchema), project_controller_1.createProject);
exports.projectRouter.patch('/:id', (0, validate_middleware_1.validateRequest)(validation_1.projectSchema), project_controller_1.updateProject);
