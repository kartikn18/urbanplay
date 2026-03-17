import { Router } from 'express';
import { createTurfHandler, createSlotHandler } from './admin.controllers';

export const AdminRouter = Router();

AdminRouter.post('/turf', createTurfHandler);
AdminRouter.post('/slot', createSlotHandler);
