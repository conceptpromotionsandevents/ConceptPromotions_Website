/* ===============================
   CLOUDINARY HELPER FUNCTIONS
=============================== */

/**
 * Determine Cloudinary resource type based on mimetype
 * @param {string} mimetype - File mimetype (e.g., 'image/jpeg', 'application/pdf')
 * @returns {string} - 'image', 'video', or 'raw'
 */
export const getResourceType = (mimetype) => {
    if (mimetype.startsWith("image/")) return "image";
    if (mimetype === "application/pdf") return "image"; // Cloudinary handles PDFs as images
    if (mimetype.startsWith("video/")) return "video";
    return "raw"; // For other document types (doc, docx, xlsx, etc.)
};
