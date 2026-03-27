import { userModel } from "./user.models";
import { db } from "../../../config/db";

export const UserService = {

  async getAllTurfs() {
    return await userModel.getAllTurfs();
  },

  async findSlotsByTurfId(turfId: number) {
    const turf = await userModel.findturfbyId(turfId);
    if (!turf) throw new Error("Turf not found");

    return await userModel.findslotsbyTurfId(turfId);
  },
  
  async bookSlot(userId: number, slotId: number, turfId: number) {
    const turf = await userModel.findturfbyId(turfId);
    if (!turf) throw new Error("Turf not found");
    const slot = await userModel.findslotsbySlotId(slotId);
    if (!slot) throw new Error("Slot not found");
    if (slot.is_booked) throw new Error("Slot already booked");
    return await db.transaction().execute(async (trx) => {
      await trx
        .updateTable("slots")
        .set({ is_booked: true })
        .where("id", "=", slotId) 
        .execute();
      return await trx
        .insertInto("bookings")
        .values({
          user_id: userId,
          slot_id: slotId,
          turf_id: turfId,
          status: "confirmed",         
        } as any)
        .returningAll()
        .executeTakeFirstOrThrow();
    });
  },
};
