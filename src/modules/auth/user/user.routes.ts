import { Router } from 'express';
import { UserController } from './user.controllers';
import { userDashboardHandler } from './dashboard';

export const Userroutes = Router();

// Public — no auth needed
Userroutes.get("/turfs/search", UserController.searchTurfs);             
Userroutes.get("/turfs/:turfId/slots", UserController.findSlotsByTurfId); 
Userroutes.get('/dashboard', userDashboardHandler);