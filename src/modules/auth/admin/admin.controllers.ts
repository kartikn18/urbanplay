import { Request, Response } from 'express';
import { CreateTurfInput, CreateSlotInput } from './admin.types';
import { createTurf, createSlot } from './admin.service';
import { uploadimage } from '../../../utils/upload.service';
export const createTurfHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to create turf" });
        }

        const adminId = req.user.id; 
        const input: CreateTurfInput = req.body;
        const files  = req.file?.buffer;
        if(!files){
            return res.status(400).json({message:"No file uploaded"});
        }
        const result = await uploadimage(files,"turfImages");
        if(result.resource_type != "image"){
            return res.status(400).json({message:"Uploaded file is not an image"});
        }
        input.image_url = result.secure_url;
        const turf = await createTurf(input, adminId);
        res.status(201).json({
            message: "Turf created successfully",
            data: turf,
        });
    } catch (error) {
        console.error("Error creating turf:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createSlotHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to create slots" });
        }

        const input: CreateSlotInput = req.body;
        const slot = await createSlot(input.turfId, input.startTime, input.endTime, input.isBooked, new Date());
        res.status(201).json({
            message: "Slot created successfully",
            data: slot,
        });
    } catch (error) {
        console.error("Error creating slot:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
