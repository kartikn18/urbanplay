import { getCoordinates } from "../../../utils/geocode";
import { CreateTurfInput } from "../admin/admin.types";
import { adminModel } from "./admin.models";

export async function createTurf(input: CreateTurfInput, adminId: number) {
    try {
        const { lat, lng, formattedAddress } = await getCoordinates(input.address);
        return await adminModel.insertTurf(input, adminId, lat, lng, formattedAddress);
    } catch (error) {
        throw new Error("Failed to create turf");
    }
}

export async function createSlot(turfId: number, startTime: Date, endTime: Date, isBooked: boolean) {
    const overlap = await adminModel.checkSlotOverlap(turfId, startTime, endTime);
    if (overlap) throw new Error("Slot overlaps with an existing slot");

    return await adminModel.createSlot(turfId, startTime, endTime, isBooked);
}