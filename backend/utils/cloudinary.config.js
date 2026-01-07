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

    console.log("📸 uploadToCloudinaryWithDetailsOverlay called with:", {
        bufferSize: buffer.length,
        folder,
        geotag,
    });

    // Safe property access
    const lat = Number(geotag.latitude) || 0;
    const lng = Number(geotag.longitude) || 0;
    const timestamp = geotag.timestamp || new Date().toISOString();

    console.log("🔢 Parsed coordinates:", { lat, lng, timestamp });

    // Get place name
    let placeName = "Location Unavailable";
    if (lat !== 0 && lng !== 0) {
        try {
            console.log(`🌍 Fetching place name for: ${lat}, ${lng}`);
            placeName = await getPlaceNameFromCoords(lat, lng);
            console.log(`✅ Place name retrieved: ${placeName}`);
        } catch (error) {
            console.error("❌ Place lookup failed:", error);
        }
    } else {
        console.log("⚠️ Skipping place lookup - coordinates are zero");
    }

    // Format date/time
    const captureDate = new Date(timestamp).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    console.log("📅 Formatted capture date:", captureDate);

    // Context metadata
    const context = {
        geotag_latitude: lat.toString(),
        geotag_longitude: lng.toString(),
        geotag_place: placeName,
        geotag_timestamp: timestamp,
    };

    console.log("📋 Cloudinary context metadata:", context);

    // Build transformation text overlays
    const coordsText = `📍 ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const placeText = placeName.substring(0, 30);
    const dateText = captureDate;

    console.log("🎨 Text overlays to be applied:", {
        coordsText,
        placeText,
        dateText,
    });

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                context,
                // ✅ Text with stroke for visibility on any background
                transformation: [
                    // Line 1: Coordinates with black stroke
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 150,
                            font_weight: "bold",
                            text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                        },
                        gravity: "south",
                        y: 350,
                        color: "black",
                    },
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 150,
                            font_weight: "bold",
                            text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
                        },
                        gravity: "south",
                        y: 355,
                        color: "white",
                    },
                    // Line 2: Place name with black stroke
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 120,
                            text: placeText,
                        },
                        gravity: "south",
                        y: 200,
                        color: "black",
                    },
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 120,
                            text: placeText,
                        },
                        gravity: "south",
                        y: 205,
                        color: "white",
                    },
                    // Line 3: Date/time with black stroke
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 100,
                            text: dateText,
                        },
                        gravity: "south",
                        y: 60,
                        color: "black",
                    },
                    {
                        overlay: {
                            font_family: "Arial",
                            font_size: 100,
                            text: dateText,
                        },
                        gravity: "south",
                        y: 65,
                        color: "white",
                    },
                ],
            },
            (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary error:", error.message);
                    reject(error);
                } else if (!result?.secure_url) {
                    reject(new Error("Invalid Cloudinary result"));
                } else {
                    console.log("✅ Text overlay added:", result.secure_url);
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
