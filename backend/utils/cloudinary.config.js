import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

// Helper function to upload buffer to Cloudinary
export const uploadToCloudinary = async (
    buffer,
    folder,
    resourceType = "image",
    context = {}
) => {
    try {
        const result = await cloudinary.uploader
            .upload_stream(
                {
                    folder: folder,
                    resource_type: resourceType,
                    context: context, // ✅ Pass geotag context here
                },
                (error, result) => {
                    if (error) throw error;
                    return result;
                }
            )
            .end(buffer);

        return result;
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
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
