import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { userModel } from './user.models';
import { redis } from '../../../config/redis';

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

            const debug = req.query.debug === "1" || req.query.debug === "true";
            if (!debug) {
                const slots = await UserService.findSlotsByTurfId(turfId);
                return res.status(200).json({
                    message: "Slots fetched successfully",
                    data: slots
                });
            }

            // Debug path: show why slots are hidden (soft-lock/past/booked filters happen elsewhere).
            const turf = await userModel.findTurfById(turfId);
            if (!turf) return res.status(404).json({ message: "Turf not found" });

            const slots = await userModel.findSlotsByTurfId(turfId);
            const keys = slots.map((s) => `slot_${s.id}`);
            const softLocks = keys.length ? await redis.mget(...keys) : [];
            const softLockedSlotIds = slots
                .filter((_, idx) => Boolean(softLocks[idx]))
                .map((s) => s.id);
            const visibleSlots = slots.filter((_, idx) => !softLocks[idx]);

            return res.status(200).json({
                message: "Slots fetched successfully",
                data: visibleSlots,
                debug: {
                    now: new Date().toISOString(),
                    totalFromDb: slots.length,
                    softLockedCount: softLockedSlotIds.length,
                    softLockedSlotIds,
                }
            });
        } catch (error) {
            next(error);
        }
    },
};
