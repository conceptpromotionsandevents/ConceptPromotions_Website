import { CareerApplication, JobApplication, Job } from "../models/user.js";
import nodemailer from "nodemailer";
import {
    uploadToCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.config.js";

/* ============================================================
   APPLY TO A JOB (Candidate) - WITH CLOUDINARY
============================================================ */
export const applyToJob = async (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    try {
        const { fullName, email, phone, city, coverLetter, jobId } = req.body;
        const resumeFile = req.file;

        /* =========================
       VALIDATION
    ========================== */
        if (!fullName || !email || !jobId) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, and job ID are required",
            });
        }

        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: "Resume file is required",
            });
        }

        // Fetch job
        const job = await Job.findById(jobId);
        if (!job || !job.isActive) {
            return res.status(404).json({
                success: false,
                message: "Job not found or inactive",
            });
        }

        /* =========================
       UPLOAD RESUME TO CLOUDINARY
    ========================== */
        let resumeData;
        try {
            const result = await uploadToCloudinary(
                resumeFile.buffer,
                "career/resumes",
                "raw" // For PDF/DOC files
            );

            resumeData = {
                url: result.secure_url,
                publicId: result.public_id,
                fileName: resumeFile.originalname,
            };
        } catch (err) {
            return res.status(500).json({
                success: false,
                message: "Resume upload failed",
                error: err.message,
            });
        }

        /* =========================
       CREATE OR UPDATE CANDIDATE
    ========================== */
        let candidate = await CareerApplication.findOne({ email });

        if (!candidate) {
            // Create new candidate
            candidate = new CareerApplication({
                fullName,
                email,
                phone,
                city,
                resume: resumeData,
            });

            await candidate.save();
        } else {
            // Update existing candidate - delete old resume from Cloudinary
            if (candidate.resume?.publicId) {
                try {
                    await deleteFromCloudinary(
                        candidate.resume.publicId,
                        "raw"
                    );
                } catch (err) {
                    console.error(
                        `Failed to delete old resume ${candidate.resume.publicId}:`,
                        err
                    );
                }
            }

            candidate.fullName = fullName;
            candidate.phone = phone;
            candidate.city = city;
            candidate.resume = resumeData;

            await candidate.save();
        }

        // Safety check
        if (!candidate?._id) {
            return res.status(500).json({
                success: false,
                message: "Candidate creation failed.",
            });
        }

        /* =========================
       CHECK FOR DUPLICATE APPLICATION
    ========================== */
        const existingApp = await JobApplication.findOne({
            candidate: candidate._id,
            job: job._id,
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: "You have already applied for this job.",
            });
        }

        /* =========================
       CREATE NEW APPLICATION
    ========================== */
        const newApplication = await JobApplication.create({
            candidate: candidate._id,
            job: job._id,
            status: "Pending",
            totalRounds: 1,
            currentRound: 0,
        });

        /* =========================
       SEND EMAIL TO APPLICANT
    ========================== */
        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });

            const applicantHtml = `
        <h3>Hello ${fullName},</h3>
        <p>Thank you for applying for the position of <strong>${
            job.title
        }</strong> at Concept Promotions.</p>
        <p>Your application has been received and is currently under review by our HR team.</p>

        <h4>Your Application Summary:</h4>
        <p><strong>Job Title:</strong> ${job.title}</p>
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Date Applied:</strong> ${new Date().toLocaleDateString()}</p>

        <br/>
        <p>Regards,<br/>Concept Promotions Careers Team</p>
      `;

            await transporter.sendMail({
                from: `"Concept Promotions Careers" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: `Application Received - ${job.title}`,
                html: applicantHtml,
            });
        } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            // Don't fail the application if email fails
        }

        /* =========================
       SUCCESS RESPONSE
    ========================== */
        return res.status(201).json({
            success: true,
            message:
                "Application submitted successfully. Confirmation email sent.",
            applicationId: newApplication._id,
        });
    } catch (err) {
        console.error("Error in applyToJob:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
};

/* ============================================================
   GET ALL JOB POSTINGS (for Candidates)
============================================================ */
export const getAllJobs = async (req, res) => {
    try {
        const { location, department, employmentType, search } = req.query;

        const filters = { isActive: true };

        if (location) filters.location = { $regex: location, $options: "i" };
        if (department)
            filters.department = { $regex: department, $options: "i" };
        if (employmentType)
            filters.employmentType = { $regex: employmentType, $options: "i" };
        if (search) filters.title = { $regex: search, $options: "i" };

        const jobs = await Job.find(filters)
            .sort({ createdAt: -1 })
            .select(
                "title description location department employmentType salaryRange experienceRequired createdAt"
            );

        if (!jobs.length)
            return res.status(404).json({
                success: false,
                message: "No job postings available",
            });

        res.status(200).json({
            success: true,
            message: "Job postings retrieved successfully",
            count: jobs.length,
            jobs,
        });
    } catch (err) {
        console.error("Error fetching jobs:", err.message);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

/* ============================================================
   GET ALL APPLICATIONS (Candidate)
============================================================ */
export const getCandidateApplications = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email)
            return res.status(400).json({
                success: false,
                message: "Email parameter required.",
            });

        const candidate = await CareerApplication.findOne({ email });
        if (!candidate)
            return res.status(404).json({
                success: false,
                message: "Candidate not found for provided email.",
            });

        const applications = await JobApplication.find({
            candidate: candidate._id,
        })
            .populate("job", "title location department employmentType")
            .select("status createdAt");

        if (!applications.length)
            return res.status(404).json({
                success: false,
                message: "No job applications found for this candidate.",
            });

        res.status(200).json({
            success: true,
            message: "Applications retrieved successfully.",
            count: applications.length,
            applications,
        });
    } catch (err) {
        console.error(" Error fetching applications:", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};
