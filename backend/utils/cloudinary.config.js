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

    // ✅ Get place name
    let placeName = "Location Unavailable";
    if (geotag.latitude && geotag.longitude) {
        try {
            placeName = await getPlaceNameFromCoords(
                geotag.latitude,
                geotag.longitude
            );
            console.log(`📍 Place name: ${placeName}`);
        } catch (error) {
            console.error("Place lookup failed:", error);
        }
    }

    // ✅ Format date/time
    const captureDate = geotag.timestamp
        ? new Date(geotag.timestamp).toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "Unknown Time";

    // ✅ Build overlay text
    const overlayText = `📍 ${geotag.latitude?.toFixed(6) || "N/A"}, ${
        geotag.longitude?.toFixed(6) || "N/A"
    }\n🏪 ${placeName}\n📅 ${captureDate}`;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                context: {
                    geotag_latitude: geotag.latitude?.toString(),
                    geotag_longitude: geotag.longitude?.toString(),
                    geotag_accuracy: geotag.accuracy?.toString(),
                    geotag_place: placeName,
                    geotag_timestamp: geotag.timestamp,
                },
            },
            (error, result) => {
                if (error) {
                    console.error("❌ Cloudinary error:", error);
                    reject(error);
                } else if (!result?.secure_url) {
                    reject(new Error("Invalid Cloudinary result"));
                } else {
                    console.log(
                        "✅ Geotagged image uploaded:",
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
