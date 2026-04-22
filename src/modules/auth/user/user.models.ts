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
async getBookingHistory(userId: number) {
    return await db
        .selectFrom("bookings")
        .innerJoin("slots", "slots.id", "bookings.slot_id")
        .innerJoin("turfinfo", "turfinfo.id", "bookings.turf_id")
        .innerJoin("payments", "payments.booking_id", "bookings.booking_id")
        .select([
            "bookings.booking_id",
            "bookings.status",
            "bookings.created_at",
            "turfinfo.name as turf_name",
            "turfinfo.location",
            "slots.start_time",
            "slots.end_time",
            "payments.amount",
            "payments.payment_status",
            "payments.razorpay_payment_id",
            "payments.recipts_url"  
        ])
        .where("bookings.user_id", "=", userId)
        .orderBy("bookings.created_at", "desc")
        .execute();
}
    
};