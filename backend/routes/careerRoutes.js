import express from "express";
import multer from "multer";
import {
  applyToJob,
  getAllJobs,
  getCandidateApplications,
} from "../controllers/careerController.js";

const router = express.Router();

// ===============================
// ✅ Multer Setup for Resume Upload
// ===============================
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
    ];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only PDF, Word, or Image allowed."));
  },
});

// ===============================
// 🔹 Job Listings and Applications
// ===============================

// Get all active jobs
router.get("/jobs", getAllJobs);

// Apply to a job (resume stored in MongoDB as Buffer)
router.post("/apply", upload.single("resume"), applyToJob);

// Get all applications for a specific candidate (optional)
router.get("/:email/applications", getCandidateApplications);

export default router;
