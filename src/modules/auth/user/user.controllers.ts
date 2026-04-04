import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';

export const UserController = {

    async searchTurfs(req: Request, res: Response, next: NextFunction) {
        try {
            const { city, name, radius } = req.query;

            if (!city || typeof city !== 'string') {
                return res.status(400).json({ message: "City is required" });
            }

            const turfs = await UserService.searchTurfs(
                city,
                name as string | undefined,
                radius ? parseInt(radius as string) : undefined
            );

            return res.status(200).json({
                message: "Turfs fetched successfully",
                data: turfs
            });
        } catch (error) {
            next(error);
        }
    },

    async findSlotsByTurfId(req: Request, res: Response, next: NextFunction) {
        try {
            const turfId = parseInt(req.params.turfId as string);
            if (isNaN(turfId)) {
                return res.status(400).json({ message: "Invalid turf ID" });
            }

            const slots = await UserService.findSlotsByTurfId(turfId);
            return res.status(200).json({
                message: "Slots fetched successfully",
                data: slots
            });
        } catch (error) {
            next(error);
        }
    },
};
