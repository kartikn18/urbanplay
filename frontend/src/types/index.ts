export type Turf = {
  id: number;
  name: string;
  location: string;
  description: string;
  price_per_hour: number;
  image_url: string;
  lat: number;
  lng: number;
  created_at?: string;
  created_by?: number;
  updated_at?: string;
};

export type Slot = {
  id: number;
  turf_id: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at?: string;
  updated_at?: string;
};

export type Booking = {
  id: number;
  slot_id: number;
  turf_id: number;
  user_id: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

export type RazorpayOrderPayload = {
  orderId: string;
  amount: number;
  currency: string;
  keyId?: string;
};

export type JwtPayload = {
  userid: number;
  role: string;
  exp: number;
  iat?: number;
};
