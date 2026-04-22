import { Request, Response } from 'express';
import { CreateTurfInput, CreateSlotInput } from './admin.types';
import { createTurf, createSlot,deleteturf, deleteslot } from './admin.service';
import { uploadimage } from '../../../utils/upload.service';
export const createTurfHandler = async (req: Request, res: Response) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to create turf" });
        }

        const adminId = req.user.id;
        const uploadedFiles = Array.isArray(req.files)
            ? req.files
            : req.file
                ? [req.file]
                : [];
        if (uploadedFiles.length === 0) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (uploadedFiles.some((file) => !allowedTypes.includes(file.mimetype))) {
            return res.status(400).json({ message: "Only JPEG, PNG, or WEBP images are allowed" });
        }
        // Current DB model stores a single image_url, so keep first image as cover.
        const result = await uploadimage(uploadedFiles[0].buffer, "turfimages");
        const turfimages = result.secure_url;
        const input:CreateTurfInput={
            ...req.body,
            image_url:turfimages
        }
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
        const adminid = req.user.id;
        const {name,startTime,endTime} = req.body;
        const slot = await createSlot(new Date(startTime), new Date(endTime), false, name, adminid);
        res.status(201).json({
            message: "Slot created successfully",
            data: slot,
        });
    } catch (error) {
        console.error("Error creating slot:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
export const deleteturfHandler = async(req:Request,res:Response)=>{
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to delete turf" });
        }
        const {id} = req.params;
        const turf = await deleteturf(Number(id));
        res.status(200).json({
            message:"Turf deleted successfully",
            data:turf
        })
    } catch (error) {
        console.error("Error deleting turf:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export const deleteslotHandler = async(req:Request,res:Response)=>{
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "You are not authorized to delete slot" });
        }
        const {turfid,slotid} = req.params;
        const slot = await deleteslot(Number(turfid),Number(slotid));
        res.status(200).json({
            message:"Slot deleted successfully",
            data:slot
        })
    } catch (error) {
        console.error("Error deleting slot:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}