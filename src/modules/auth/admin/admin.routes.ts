import { Router } from 'express';
import { createTurfHandler, createSlotHandler,deleteturfHandler,deleteslotHandler } from './admin.controllers';
import { authenticateToken, checkrole } from '../../../middlewares/authentication';
import upload  from '../../../config/multer';

export const AdminRoutes = Router();

AdminRoutes.post('/turf',authenticateToken,checkrole(["admin"]), upload.array('image',5), createTurfHandler);
AdminRoutes.post('/slot', authenticateToken, checkrole(["admin"]), createSlotHandler);
AdminRoutes.post('/deleteturf', authenticateToken, checkrole(["admin"]), deleteturfHandler);
AdminRoutes.post('/deleteslot', authenticateToken, checkrole(["admin"]), deleteslotHandler);