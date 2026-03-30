import axios from "axios";

export async function getCoordinates(city: string) {
  
  const response = await axios.get(
    `https://nominatim.openstreetmap.org/search`,
    {
      params: {
        q: city,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "turf-booking-app"
      }
    }
  );
  const data = response.data;
  if (!data || data.length === 0) {
    throw new Error("City not found");
  }
  const lat = parseFloat(data[0].lat);
  const lng = parseFloat(data[0].lon);     
  const formattedAddress = data[0].display_name;
  return { lat, lng, formattedAddress };
}