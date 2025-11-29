import type { Competitor, PlaceResult } from "@shared/schema";

const API_KEY = process.env.GOOGLE_API_KEY;

export function hasGoogleApiKey(): boolean {
  return !!API_KEY;
}

export async function searchPlacesByAddress(query: string): Promise<PlaceResult[]> {
  if (!API_KEY) {
    console.log("Google API Key not configured, returning empty results");
    return [];
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location",
        },
        body: JSON.stringify({
          textQuery: query,
          maxResultCount: 10,
        }),
      }
    );

    if (!response.ok) {
      console.error("Google Places API error:", response.statusText);
      return [];
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return [];
    }

    return data.places.map((place: any) => ({
      placeId: place.id || "",
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "",
      latitude: place.location?.latitude || 0,
      longitude: place.location?.longitude || 0,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types,
    }));
  } catch (error) {
    console.error("Error searching places:", error);
    return [];
  }
}

export async function searchNearby(
  lat: number,
  lng: number,
  type: string,
  radius: number = 1500
): Promise<Competitor[]> {
  if (!API_KEY) {
    console.log("Google API Key not configured, returning mock data");
    return generateMockCompetitors(type, lat, lng);
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.location,places.priceLevel",
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: {
                latitude: lat,
                longitude: lng,
              },
              radius: radius,
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Google Places API error:", response.statusText);
      return generateMockCompetitors(type, lat, lng);
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      return [];
    }

    return data.places.map((place: any) => ({
      name: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "Address not available",
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types,
      distance: calculateDistance(lat, lng, place.location?.latitude, place.location?.longitude),
      priceLevel: formatPriceLevel(place.priceLevel),
    }));
  } catch (error) {
    console.error("Error fetching from Google Places:", error);
    return generateMockCompetitors(type, lat, lng);
  }
}

function formatPriceLevel(priceLevel?: string): string | undefined {
  if (!priceLevel) return undefined;
  const priceLevelMap: Record<string, string> = {
    "PRICE_LEVEL_FREE": "Free",
    "PRICE_LEVEL_INEXPENSIVE": "$",
    "PRICE_LEVEL_MODERATE": "$$",
    "PRICE_LEVEL_EXPENSIVE": "$$$",
    "PRICE_LEVEL_VERY_EXPENSIVE": "$$$$",
  };
  return priceLevelMap[priceLevel] || undefined;
}

function calculateDistance(lat1: number, lng1: number, lat2?: number, lng2?: number): string {
  if (!lat2 || !lng2) return "Unknown";
  
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

function generateMockCompetitors(type: string, lat: number, lng: number): Competitor[] {
  const businessNames: Record<string, string[]> = {
    restaurant: ["The Golden Fork", "Bistro Milano", "Casa Verde", "Ocean Breeze Grill", "The Hungry Chef"],
    cafe: ["Morning Brew", "The Coffee House", "Bean & Leaf", "Espresso Junction", "Cozy Corner Cafe"],
    retail: ["City Mart", "Fashion Forward", "Tech Haven", "Home & Living", "The General Store"],
    gym: ["PowerFit Studio", "Iron Temple", "FitLife Center", "Muscle Factory", "Core Strength Gym"],
    salon: ["Glamour Studio", "Hair & Beyond", "The Beauty Bar", "Style Salon", "Radiance Spa"],
    pharmacy: ["HealthFirst Pharmacy", "MedCare Plus", "QuickMeds", "Wellness Pharmacy", "Family Drug Store"],
    hotel: ["Grand Plaza Hotel", "Comfort Inn", "The Riverside Lodge", "City Center Hotel", "Sunset Suites"],
    bar: ["The Night Owl", "Cheers Pub", "The Tipsy Glass", "Moonlight Lounge", "Draft House"],
    bakery: ["Sweet Delights", "The Bread Basket", "Golden Crust", "Sugar & Spice", "The Pastry Corner"],
    supermarket: ["Fresh Mart", "Super Save", "Daily Grocers", "The Food Emporium", "Value Market"],
    clinic: ["City Health Clinic", "Family Care Center", "MedFirst Clinic", "Wellness Medical", "QuickCare"],
    dentist: ["Smile Dental", "Bright Teeth Clinic", "Family Dentistry", "Dental Care Plus", "Pearl Dental"],
    bank: ["City Bank", "Trust Financial", "First National", "Capital Bank", "Unity Bank"],
    gas_station: ["Quick Fuel", "Energy Plus", "City Gas", "Fast Lane Fuel", "Green Energy Station"],
    car_repair: ["Auto Care Center", "Quick Fix Garage", "Master Mechanics", "Pro Auto Service", "Drive Right Repairs"],
    other: ["Local Business", "Community Store", "Service Center", "The Local Hub", "Main Street Shop"],
  };

  const names = businessNames[type] || businessNames.other;
  const numCompetitors = Math.floor(Math.random() * 4) + 2;

  const priceLevels = ["$", "$$", "$$$", "$$$$"];
  return names.slice(0, numCompetitors).map((name, index) => ({
    name,
    address: `${100 + index * 50} Main Street, Local City`,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    userRatingsTotal: Math.floor(Math.random() * 500) + 50,
    types: [type],
    distance: `${(Math.random() * 1.5 + 0.2).toFixed(1)}km`,
    priceLevel: priceLevels[Math.floor(Math.random() * priceLevels.length)],
  }));
}
