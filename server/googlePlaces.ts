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
  radius: number = 1500,
  includeReviews: boolean = true,
  language: string = "en"
): Promise<Competitor[]> {
  if (!API_KEY) {
    console.log("Google API Key not configured");
    throw new Error("Google Places API Key not configured. Please contact administrator.");
  }

  try {
    const fieldMask = [
      "places.displayName",
      "places.formattedAddress",
      "places.rating",
      "places.userRatingCount",
      "places.types",
      "places.location",
      "places.priceLevel"
    ];

    if (includeReviews) {
      fieldMask.push("places.reviews");
    }

    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchNearby",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": API_KEY,
          "X-Goog-FieldMask": fieldMask.join(","),
        },
        body: JSON.stringify({
          includedTypes: [type],
          maxResultCount: 10,
          languageCode: language,
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
      throw new Error(`Google Places API Error: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.places || data.places.length === 0) {
      console.log("No places found nearby");
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
      reviews: includeReviews && place.reviews
        ? place.reviews
          .map((r: any) => ({
            text: r.text?.text || "",
            originalText: r.originalText?.text !== r.text?.text ? r.originalText?.text : undefined,
            author: r.authorAttribution?.displayName || "Anonymous",
            rating: r.rating || 0,
            date: r.publishTime || new Date().toISOString()
          }))
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
        : undefined,
      latitude: place.location?.latitude,
      longitude: place.location?.longitude
    }));
  } catch (error) {
    console.error("Error fetching from Google Places:", error);
    // Re-throw to be handled by reports.ts
    throw error;
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

function generateMockCompetitors(type: string, lat: number, lng: number, includeReviews: boolean = true): Competitor[] {
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

  const mockReviews = [
    "Great service and friendly staff!",
    "A bit pricey but worth it for the quality.",
    "Wait times can be long during peak hours.",
    "Best in town, highly recommended!",
    "Average experience, nothing special.",
    "Clean and well-maintained facility.",
    "Staff was rude and unhelpful.",
    "Excellent value for money.",
    "Will definitely come back again!",
    "Not what I expected, disappointed."
  ];

  return names.slice(0, numCompetitors).map((name, index) => ({
    name,
    address: `${100 + index * 50} Main Street, Local City`,
    rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
    userRatingsTotal: Math.floor(Math.random() * 500) + 50,
    types: [type],
    distance: `${(Math.random() * 1.5 + 0.2).toFixed(1)}km`,
    priceLevel: priceLevels[Math.floor(Math.random() * priceLevels.length)],
    reviews: includeReviews
      ? Array.from({ length: 5 }, (_, i) => ({
        text: mockReviews[Math.floor(Math.random() * mockReviews.length)],
        author: `User ${Math.floor(Math.random() * 1000)}`,
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : undefined,
    latitude: lat + (Math.random() - 0.5) * 0.02, // Random location within ~2km
    longitude: lng + (Math.random() - 0.5) * 0.02
  }));
}
