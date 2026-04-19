import { Router } from 'express';
import { createTurfHandler, createSlotHandler } from './admin.controllers';
import { authenticateToken, checkrole } from '../../../middlewares/authentication';
import upload  from '../../../config/multer';

export const AdminRoutes = Router();

AdminRoutes.post('/turf',authenticateToken,checkrole(["admin"]), upload.single('image'), createTurfHandler);
AdminRoutes.post('/slot', authenticateToken, checkrole(["admin"]), createSlotHandler);
