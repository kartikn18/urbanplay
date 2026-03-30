import { Router } from 'express';
import { createTurfHandler, createSlotHandler } from './admin.controllers';
import { authenticateToken, checkrole } from '../../../middlewares/authentication';

export const AdminRoutes = Router();

AdminRoutes.post('/turf',authenticateToken,checkrole(["admin"]), createTurfHandler);
AdminRoutes.post('/slot', authenticateToken, checkrole(["admin"]), createSlotHandler);
