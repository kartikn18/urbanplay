import { userModel } from "./user.models";
import { getCoordinates } from "../../../utils/geocode";
import { redis } from "../../../config/redis";

export const UserService = {

    async searchTurfs(city: string, name?: string, radius?: number) {
        if (!city?.trim()) throw new Error("City is required");

        let coords;
        try {
            coords = await getCoordinates(city);
        } catch {
            throw new Error("Invalid city or geocoding service unavailable");
        }

        const turfs = await userModel.searchTurfs({
            lat: coords.lat,
            lng: coords.lng,
            name,
            radius
        });

        if (turfs.length === 0) throw new Error("No turfs found in this area");
        return turfs;
    },

    async findSlotsByTurfId(turfId: number) {
        const turf = await userModel.findTurfById(turfId);
        if (!turf) throw new Error("Turf not found");

        const slots = await userModel.findSlotsByTurfId(turfId);
        if (slots.length === 0) return [];

        const slotSoftLockKeys = slots.map((slot) => `slot_${slot.id}`);
        const softLockStates = await redis.mget(...slotSoftLockKeys);

        return slots.filter((_, index) => !softLockStates[index]);
    },
    async paymenthistory(userId: number) {
        return await userModel.getBookingHistory(userId);
    },

};
