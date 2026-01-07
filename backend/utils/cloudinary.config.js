import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { getPlaceNameFromCoords } from "./tagToPlace.js";

// Load environment variables
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export const uploadToCloudinary = async (
    buffer,
    folder,
    resourceType = "image",
    context = {}
) => {
    return new Promise((resolve, reject) => {
        console.log("🚀 Starting Cloudinary upload:", {
            folder,
            resourceType,
            bufferSize: buffer.length,
            contextKeys: Object.keys(context),
        });

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: folder,
                resource_type: resourceType,
                context: context,
            },
            (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary upload error:", {
                        message: error.message,
                        http_code: error.http_code,
                        error: error,
                    });
                    reject(error);
                } else if (!result) {
                    console.error("❌ No result returned from Cloudinary");
                    reject(new Error("No result from Cloudinary"));
                } else if (!result.secure_url || !result.public_id) {
                    console.error("❌ Invalid Cloudinary result:", result);
                    reject(new Error("Missing secure_url or public_id"));
                } else {
                    console.log("✅ Cloudinary upload success:", {
                        secure_url: result.secure_url,
                        public_id: result.public_id,
                        width: result.width,
                        height: result.height,
                        format: result.format,
                    });
                    resolve(result);
                }
            }
        );

        // ✅ Handle stream errors
        uploadStream.on("error", (streamError) => {
            console.error("❌ Upload stream error:", streamError);
            reject(streamError);
        });

        uploadStream.end(buffer);
    });
};

export const uploadToCloudinaryWithDetailsOverlay = async (
    buffer,
    folder,
    geotag = {}
) => {
    if (!buffer || buffer.length === 0) {
        throw new Error("Empty buffer provided");
    }

    // Safe property access
    const lat = geotag.latitude || 0;
    const lng = geotag.longitude || 0;
    const accuracy = geotag.accuracy || 0;
    const timestamp = geotag.timestamp || new Date().toISOString();

    console.log("🔍 Geotag data:", { lat, lng, accuracy, timestamp });

    // Get place name
    let placeName = "Location Unavailable";
    if (lat !== 0 && lng !== 0) {
        try {
            placeName = await getPlaceNameFromCoords(lat, lng);
            console.log(`📍 Place name: ${placeName}`);
        } catch (error) {
            console.error("Place lookup failed:", error);
        }
    }

    // Format date/time
    const captureDate = new Date(timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    // Shorten place name
    const shortPlace =
        placeName.length > 40 ? placeName.substring(0, 37) + "..." : placeName;

    // Build context (metadata)
    const context = {};
    if (lat !== 0) context.geotag_latitude = lat.toString();
    if (lng !== 0) context.geotag_longitude = lng.toString();
    if (accuracy !== 0) context.geotag_accuracy = accuracy.toString();
    context.geotag_place = placeName;
    context.geotag_timestamp = timestamp;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                context,
                // ✅ FIXED TRANSFORMATIONS - No "black" overlay
                transformation: [
                    // 1. Resize (optional)
                    { width: 1200, height: 1600, crop: "limit" },

                    // 2. Semi-transparent background rectangle
                    {
                        underlay: "white", // ✅ Use underlay instead of overlay
                        opacity: 20,
                        width: 350,
                        height: 120,
                        gravity: "south_west",
                        x: 20,
                        y: 20,
                    },

                    // 3. GPS Coordinates (bold white text)
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 24,
                            font_weight: "bold",
                            text: encodeURIComponent(
                                `📍 GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                            ),
                        },
                        gravity: "south_west",
                        x: 25,
                        y: 35,
                        color: "black",
                    },

                    // 4. Place Name
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 18,
                            text: encodeURIComponent(shortPlace),
                        },
                        gravity: "south_west",
                        x: 25,
                        y: 65,
                        color: "black",
                    },

                    // 5. Date/Time
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 16,
                            text: encodeURIComponent(captureDate),
                        },
                        gravity: "south_west",
                        x: 25,
                        y: 90,
                        color: "black",
                    },
                ],
            },
            (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary error:", error);
                    reject(error);
                } else if (!result?.secure_url) {
                    reject(new Error("Invalid Cloudinary result"));
                } else {
                    console.log(
                        "✅ Image with overlay uploaded:",
                        result.secure_url
                    );
                    resolve(result);
                }
            }
        );

        stream.end(buffer);
    });
};

// Helper function to delete from Cloudinary
export const deleteFromCloudinary = async (
    publicId,
    resourceType = "image"
) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (error) {
        throw error;
    }
};

export default cloudinary;
