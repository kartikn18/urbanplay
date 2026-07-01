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
        const uploadResults = await Promise.all(
            uploadedFiles.slice(0, 5).map((f) => uploadimage(f.buffer, "turfimages")),
        );
        const turfimages = uploadResults.map((r) => r.secure_url).filter(Boolean);
        if (turfimages.length === 0) {
            return res.status(400).json({ message: "Image upload failed" });
        }
        const password = req.body.password;
        if (!password || typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        const input:CreateTurfInput={
            ...req.body,
            password,
            image_url:turfimages[0],
            image_urls: turfimages,
        }
        const turf = await createTurf(input, adminId);
        const { password: _pw, ...safeTurf } = turf as typeof turf & { password?: string };
        res.status(201).json({
            message: "Turf created successfully",
            data: safeTurf,
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
        const { name, startTime, endTime, turfPassword } = req.body;
        if (!turfPassword || typeof turfPassword !== "string") {
            return res.status(400).json({ message: "Turf password is required" });
        }
        const slot = await createSlot(
            new Date(startTime),
            new Date(endTime),
            false,
            name,
            adminid,
            turfPassword,
        );
        res.status(201).json({
            message: "Slot created successfully",
            data: slot,
        });
    } catch (error) {
        console.error("Error creating slot:", error);
        if (error instanceof Error) {
            if (error.message === "Turf not found") {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === "Invalid turf password" || error.message === "Turf password not set") {
                return res.status(403).json({ message: error.message });
            }
            if (error.message === "Slot overlaps with an existing slot") {
                return res.status(409).json({ message: error.message });
            }
        }
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