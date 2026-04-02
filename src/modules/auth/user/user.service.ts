import { userModel } from "./user.models";
import { getCoordinates } from "../../../utils/geocode";

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

        return await userModel.findSlotsByTurfId(turfId);
    }
};