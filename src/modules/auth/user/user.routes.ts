import { Router } from 'express';
import { UserController } from './user.controllers';
import { userDashboardHandler } from './dashboard';
import { authenticateToken } from '../../../middlewares/authentication';

export const Userroutes = Router();

// Public — no auth needed
Userroutes.get("/turfs/search", UserController.searchTurfs);             
Userroutes.get("/turfs/:turfId/slots", UserController.findSlotsByTurfId); 
// Protected — needs auth
Userroutes.get('/dashboard', authenticateToken, userDashboardHandler);