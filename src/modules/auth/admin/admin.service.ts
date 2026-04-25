import { getCoordinates } from "../../../utils/geocode";
import { CreateTurfInput } from "../admin/admin.types";
import { adminModel } from "./admin.models";
export async function createTurf(input: CreateTurfInput, adminId: number) {
    try {
        const { lat, lng, formattedAddress } = await getCoordinates(input.city);
        const turf = await adminModel.insertTurf(input, adminId, lat, lng, formattedAddress);
        if (input.image_urls?.length) {
            await adminModel.insertTurfImages(turf.id, input.image_urls);
        } else if (input.image_url) {
            await adminModel.insertTurfImages(turf.id, [input.image_url]);
        }
        return turf;
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
export async function deleteturf(id:number){
    return await adminModel.deleteturf(id);
}
export async function deleteslot(turfid:number,slotid :number){
    return await adminModel.deleteslot(turfid,slotid);
};