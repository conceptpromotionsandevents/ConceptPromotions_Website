// ✅ Reverse geocoding using OpenStreetMap Nominatim (FREE)
export const getPlaceNameFromCoords = async (lat, lng) => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
            {
                headers: {
                    "User-Agent":
                        "ConceptPromotions/1.0 (contact@conceptpromotions.com)",
                },
            }
        );

        const data = await response.json();
        return data.display_name || "Unknown Location";
    } catch (error) {
        console.error("Reverse geocoding failed:", error);
        return "Location Unavailable";
    }
};
