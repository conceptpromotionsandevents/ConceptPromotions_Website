import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    loginClientAdmin,
    loginClientUser,
   
    
    getClientCampaigns,
   
} from "../controllers/clientController.js";

const router = express.Router();

// CLIENT LOGIN
router.post("/admin/login", loginClientAdmin);
router.post("/user/login", loginClientUser);
router.get("/client/campaigns", protect, getClientCampaigns);




export default router;
