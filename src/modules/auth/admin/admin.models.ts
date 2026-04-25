import {db} from "../../../config/db"
import { CreateTurfInput } from "./admin.types"

export const adminModel = {
  async insertTurf(input: CreateTurfInput, adminId: number, lat: number, lng: number, formattedAddress: string) {
    const turf = await db
      .insertInto("turfinfo")
      .values({
        name: input.name,
        description: input.description,
        location: formattedAddress,
        lat,
        lng,
        image_url: input.image_url,
        price_per_hour: input.price,
        created_by: adminId,
      } as any)
      .returningAll()
      .executeTakeFirstOrThrow();

      return turf;
    },

  async insertTurfImages(turfId: number, urls: string[]) {
    if (!urls.length) return;
    await db
      .insertInto("turf_images")
      .values(
        urls.slice(0, 5).map((url, idx) => ({
          turf_id: turfId,
          url,
          sort_order: idx,
        })) as any,
      )
      .execute();
  },
async createSlot(turfId:number,startTime:Date,endTime:Date,isBooked:boolean,createdAt?:Date){
    const slot = await db.
    insertInto("slots").
    values({
        turf_id:turfId,
        start_time:startTime,
        end_time:endTime,
        is_booked:isBooked,
        created_at:createdAt || new Date()
    } as any).
    returningAll().
    executeTakeFirstOrThrow();
    return slot;
    },
    async checkSlotOverlap(turfId: number, startTime: Date, endTime: Date) {
    const existing = await db
        .selectFrom("slots")
        .where("turf_id", "=", turfId)
        .where("start_time", "<", endTime)
        .where("end_time", ">", startTime)
        .executeTakeFirst();
    return !!existing;
},
async getturfname(name:string,id:number){
  const turf = await db.selectFrom("turfinfo").
  where("name","=",name).
  where("created_by","=",id).
  selectAll()
  .executeTakeFirst();
  return turf;
},
async deleteturf(id:number){
  const turf = await db.selectFrom('turfinfo').selectAll().where("id","=",id).executeTakeFirst();
  if(!turf) throw new Error("Turf not found");
  await db.deleteFrom("turfinfo").where("id","=",id).execute();
  return turf;
},
async deleteslot(turfid:number,slotid :number){
  const turf = await db.selectFrom('slots').selectAll().where("id","=",slotid).where("turf_id","=",turfid).executeTakeFirst();
  if(!turf) throw new Error("Slot not found");
  await db.deleteFrom("slots").where("id","=",slotid).execute();
  return turf;
}
};
