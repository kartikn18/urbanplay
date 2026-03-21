import { userModel } from "./user.models";

export const UserService = {
    async getAllTurfs(){
        return await userModel.getAllTurfs();
    },
    async findslotsbyTurfId(turfId:number){
        const turf = await userModel.findturfbyId(turfId);
        if(!turf){
            throw new Error("Turf not found");
        }
        return await userModel.findslotsbyTurfId(turfId);
    },
    async bookSlot(userId:number,slotId:number){
        const slot = await userModel.findslotsbySlotId(slotId);
        if(!slot){
            throw new Error("Slot not found or already booked");
        }
        if(slot.is_booked){
            throw new Error("Slot already booked");
        }
        else
        return await userModel.bookslot(userId,slotId);
    },
}