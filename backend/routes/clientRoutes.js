import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../utils/upload.js"; 
import {
    loginClientAdmin,
    loginClientUser,
    uploadProfilePicture,
    deleteProfilePicture,
    getClientProfile,
    getClientCampaigns,
} from "../controllers/clientController.js";

const router = express.Router();

// CLIENT LOGIN
router.post("/admin/login", loginClientAdmin);
router.post("/user/login", loginClientUser);

// CLIENT PROFILE ROUTES
router.get("/client/profile", protect, getClientProfile);
router.post(
    "/client/profile-picture",
    protect,
    upload.single("profilePicture"),
    uploadProfilePicture
);
router.delete("/client/profile-picture", protect, deleteProfilePicture);

// CLIENT CAMPAIGNS
router.get("/client/campaigns", protect, getClientCampaigns);

export default router;
