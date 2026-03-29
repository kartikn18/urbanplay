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
async createSlot(turfId:number,startTime:Date,endTime:Date,isBooked:boolean,createdAt:Date){
    const slot = await db.
    insertInto("slots").
    values({
        turf_id:turfId,
        start_time:startTime,
        end_time:endTime,
        is_booked:isBooked,
        created_at:new Date()
    } as any).
    returningAll().
    executeTakeFirstOrThrow();
    return slot;
    }
  };
