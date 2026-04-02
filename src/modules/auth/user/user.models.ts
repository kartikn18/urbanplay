import { db } from "../../../config/db";
import { sql } from "kysely";

export const userModel = {

    async findTurfById(turfId: number) {
        return await db
            .selectFrom("turfinfo")
            .selectAll()
            .where("id", "=", turfId)
            .executeTakeFirst();
    },

    async findSlotsByTurfId(turfId: number) {
        return await db
            .selectFrom("slots")
            .selectAll()
            .where("turf_id", "=", turfId)
            .where("is_booked", "=", false) // only available slots
            .execute();
    },

    async findSlotsBySlotId(slotId: number, turfId: number) {
        return await db
            .selectFrom("slots")
            .selectAll()
            .where("id", "=", slotId)
            .where("turf_id", "=", turfId) // ownership check
            .where("is_booked", "=", false)
            .executeTakeFirst();
    },



    async getBookingsByUserId(userId: number) {
        return await db
            .selectFrom("bookings")
            .selectAll()
            .where("user_id", "=", userId)
            .execute();
    },

    async searchTurfs(filters: { lat: number; lng: number; name?: string; radius?: number }) {
        let query = db.selectFrom("turfinfo").selectAll();

        if (filters.name) {
            query = query.where("name", "ilike", `%${filters.name}%`);
        }

        query = query.where(
            sql`(6371 * acos(cos(radians(${filters.lat})) * cos(radians(lat)) *
            cos(radians(lng) - radians(${filters.lng})) +
            sin(radians(${filters.lat})) * sin(radians(lat))))`,
            "<=",
            filters.radius || 10
        );

        return await query.execute();
    },
};