import { Router } from 'express';
import { createTurfHandler, createSlotHandler } from './admin.controllers';
import { authenticateToken, checkrole } from '../../../middlewares/authentication';

export const AdminRouter = Router();

AdminRouter.post('/turf',authenticateToken,checkrole(["admin"]), createTurfHandler);
AdminRouter.post('/slot', authenticateToken, checkrole(["admin"]), createSlotHandler);
