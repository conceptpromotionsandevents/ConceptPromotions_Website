export const getPlaceNameFromCoords = async (lat, lng, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            // Add delay to avoid rate limiting
            if (i > 0)
                await new Promise((resolve) => setTimeout(resolve, 1000));

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16`,
                {
                    headers: {
                        "User-Agent": "ConceptPromotions/1.0",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();

            if (data.display_name) {
                return data.display_name;
            }

            // Try address components
            if (data.address) {
                const parts = [
                    data.address.road,
                    data.address.suburb,
                    data.address.city || data.address.state_district,
                    data.address.state,
                ].filter(Boolean);
                return parts.join(", ");
            }
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error.message);
        }
    }

    return "Location Unavailable";
};
