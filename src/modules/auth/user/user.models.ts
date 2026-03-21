import {db} from "../../../config/db";
export const userModel = {

  
  async getAllTurfs() {
    return await db
      .selectFrom("turfinfo")
      .selectAll()
      .execute();
  },
    async findturfbyId(turfId:number){
        return await db.selectFrom("turfinfo").selectAll().where("id","=",turfId).executeTakeFirst();
    },
    async findslotsbyTurfId(turfId:number){
        return await db.selectFrom("slots").selectAll().where("turf_id","=",turfId).execute();
    },
    async findslotsbySlotId(slotId:number){
        return await db.selectFrom("slots").selectAll().where("id","=",slotId,).where("is_booked","=",false,).executeTakeFirst();
    },
    async bookslot(userId:number,slotId:number){
        return await db.insertInto("bookings").values({user_id:userId,slot_id:slotId,status:"booked"}as any).execute();
    }   ,
    async getbookingsbyUserId(userId:number){
        return await db.selectFrom("bookings").selectAll().where("user_id","=",userId).execute();
    }
}