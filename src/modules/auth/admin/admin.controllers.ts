import e, {Request,Response} from 'express';
import { CreateTurfInput } from './admin.types';
import { createTurf, createSlot } from './admin.service';
import { CreateSlotInput } from './admin.types';

export const createTurfHandler = async ( req:Request,res:Response) => {
    try {
        const adminId = req.user.id;    // Assuming you have authentication middleware that sets req.user.id
        const input:CreateTurfInput = req.body;
        const turf = await createTurf(input,adminId);
        res.status(201).json({
            message:"Turf created successfully",
            data:turf,
        })
    } catch (error) {
        console.error("Error creating turf:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const createSlotHandler = async (req:Request,res:Response) => {
    try {
        const input:CreateSlotInput = req.body;
        const slot = await createSlot(input.turfId,input.startTime,input.endTime,input.isBooked,new Date());
        res.status(201).json({
            message:"Slot created successfully",
            data:slot,
        })
    } catch (error) {
        console.error("Error creating slot:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};