import { Router } from 'express';
import { UserController } from './user.controllers';

export const Userroutes = Router();

// Public — no auth needed
Userroutes.get("/turfs/search", UserController.searchTurfs);             
Userroutes.get("/turfs/:turfId/slots", UserController.findSlotsByTurfId); // get available slots