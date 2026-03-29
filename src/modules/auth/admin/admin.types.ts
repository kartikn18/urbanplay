import { z } from 'zod';

export const createTurfSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  address: z.string().min(1),
  price: z.number().positive(),
});

export const createSlotSchema = z.object({
  turfId: z.number().int().positive(),
  startTime: z.coerce.date(), // auto-converts string → Date
  endTime: z.coerce.date(),
  isBooked: z.boolean().default(false),
}).refine(data => data.endTime > data.startTime, {
  message: "endTime must be after startTime"
});
export interface CreateTurfInput {
  name: string;
  description: string;
  address: string;
  image_url: string;
  price:number;
}

export interface TurfLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface CreateTurfResponse {
  turf_id: string;
  name: string;
  description: string;
  location: TurfLocation;
  image_url: string;
  created_at: string;
}
export interface CreateSlotInput {
  turfId: number;
  startTime: Date;
  endTime: Date;
  isBooked: boolean;
}
