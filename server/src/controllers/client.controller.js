"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClient = exports.getClients = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../prisma");
exports.getClients = (0, express_async_handler_1.default)(async (req, res) => {
    const clients = await prisma_1.prisma.client.findMany({
        orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: clients });
});
exports.createClient = (0, express_async_handler_1.default)(async (req, res) => {
    const { name } = req.body;
    const client = await prisma_1.prisma.client.create({ data: { name } });
    res.status(201).json({ success: true, data: client });
});
