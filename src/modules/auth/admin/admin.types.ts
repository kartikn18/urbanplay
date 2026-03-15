export interface CreateTurfInput {
  name: string;
  description: string;
  address: string;
  image_url: string;
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