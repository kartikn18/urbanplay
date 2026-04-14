import { getCoordinates } from "../../../utils/geocode";
import { CreateTurfInput } from "../admin/admin.types";
import { adminModel } from "./admin.models";

export async function createTurf(input: CreateTurfInput, adminId: number) {
    try {
        const { lat, lng, formattedAddress } = await getCoordinates(input.city);
        return await adminModel.insertTurf(input, adminId, lat, lng, formattedAddress);
    } catch (error) {
        throw new Error("Failed to create turf");
    }
}

export async function createSlot(startTime: Date, endTime: Date, isBooked: boolean,name:string,id:number) {
    const turf = await adminModel.getturfname(name,id);
    if(!turf) throw new Error("Turf not found");
    const turfId = turf.id;
    const overlap = await adminModel.checkSlotOverlap(turfId, startTime, endTime);
    if (overlap) throw new Error("Slot overlaps with an existing slot");

    return await adminModel.createSlot(turfId, startTime, endTime, isBooked);
}