"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activityRouter = void 0;
const express_1 = require("express");
const activity_controller_1 = require("../controllers/activity.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
exports.activityRouter = (0, express_1.Router)();
exports.activityRouter.use(auth_middleware_1.requireAuth);
exports.activityRouter.get('/', activity_controller_1.getRecentActivity);
