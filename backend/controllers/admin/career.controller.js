// admin/career.controller.js
import mongoose from "mongoose";
import { Job, JobApplication, CareerApplication } from "../../models/user.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.config.js";

// ====== CREATE JOB POSTING ======
export const createJobPosting = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can create job postings" });

        const {
            title,
            description,
            location,
            salaryRange,
            experienceRequired,
            employmentType,
            totalRounds,
        } = req.body;
        if (!title || !description || !location)
            return res.status(400).json({
                message: "title, description, and location are required",
            });

        const job = new Job({
            title,
            description,
            location,
            salaryRange,
            experienceRequired,
            employmentType,
            totalRounds: totalRounds || 1,
            createdBy: req.user.id,
            isActive: true,
        });

        await job.save();
        res.status(201).json({ message: "Job created successfully", job });
    } catch (error) {
        console.error("Create job posting error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET ADMIN JOBS ======
export const getAdminJobs = async (req, res) => {
    try {
        if (!req.user || !req.user.id)
            return res
                .status(401)
                .json({ message: "Not authorized, please log in" });

        const admin = await Admin.findById(req.user.id);
        if (!admin)
            return res
                .status(403)
                .json({ message: "Only registered admins can view jobs" });

        const jobs = await Job.find().sort({ createdAt: -1 });
        res.status(200).json({ jobs });
    } catch (error) {
        console.error("Get admin jobs error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET JOB APPLICATIONS ======
export const getJobApplications = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin")
            return res
                .status(403)
                .json({ message: "Only admins can view applications" });

        const { jobId } = req.params;
        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ message: "Job not found" });
        if (job.createdBy.toString() !== req.user.id)
            return res.status(403).json({
                message: "Not authorized to view applications for this job",
            });

        const applications = await JobApplication.find({ job: jobId })
            .populate("candidate", "fullName email phoneNumber")
            .sort({ appliedAt: -1 });

        res.status(200).json({ applications });
    } catch (error) {
        console.error("Get job applications error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== UPDATE APPLICATION STATUS ======
export const updateApplicationStatus = async (req, res) => {
    try {
        const { applicationId } = req.params;
        const { status, currentRound, totalRounds } = req.body;

        if (!applicationId)
            return res
                .status(400)
                .json({ message: "Application ID is required" });

        // 1️ Find the application
        const application = await JobApplication.findById(applicationId)
            .populate("candidate")
            .populate("job");

        if (!application)
            return res.status(404).json({ message: "Application not found" });

        // 2️ Update fields
        if (status) application.status = status;
        if (currentRound !== undefined) application.currentRound = currentRound;
        if (totalRounds !== undefined) application.totalRounds = totalRounds;
        await application.save();

        const { fullName, email } = application.candidate;
        const { title } = application.job;

        // 3️ Prepare email content
        const htmlContent = `
      <h2>Application Status Updated</h2>
      <p>Dear ${fullName},</p>
      <p>Your application status for the position of <strong>${title}</strong> has been updated.</p>
      <p><strong>Status:</strong> ${application.status}</p>
      ${
          application.currentRound
              ? `<p><strong>Current Round:</strong> ${application.currentRound} / ${application.totalRounds}</p>`
              : ""
      }
      <br/>
      <p>Thank you for your continued interest.</p>
      <p>Best regards,<br/>HR Team</p>
    `;

        if (process.env.NODE_ENV === "production") {
            try {
                const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: "Career Portal <onboarding@resend.dev>",
                        to: [email],
                        subject: `Application Update for ${title}`,
                        html: htmlContent,
                    }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(" Resend email failed:", errorText);
                } else {
                    console.log(` Resend email sent successfully to ${email}`);
                }
            } catch (emailErr) {
                console.error(" Resend error:", emailErr.message);
            }
        } else {
            // 5️⃣ Use Gmail locally (for testing)
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS,
                    },
                });

                await transporter.sendMail({
                    from: `"Career Portal" <${process.env.EMAIL_USER}>`,
                    to: email,
                    subject: `Application Update for ${title}`,
                    html: htmlContent,
                });

                console.log(` Local email sent to ${email}`);
            } catch (emailErr) {
                console.error(" Local email error:", emailErr.message);
            }
        }

        // 6️⃣ Respond success
        res.status(200).json({
            message: "Application status updated and email notification sent.",
            updatedApplication: application,
        });
    } catch (err) {
        console.error(" Error updating application status:", err);
        res.status(500).json({
            message: "Internal server error",
            error: err.message,
        });
    }
};

// ====== UPDATE JOB POSTING ======
export const updateJobPosting = async (req, res) => {
    try {
        if (!req.user || !req.user.id)
            return res
                .status(401)
                .json({ message: "Not authorized, please log in" });

        const { id } = req.params;
        const {
            title,
            description,
            location,
            salaryRange,
            experienceRequired,
            employmentType,
            isActive,
        } = req.body;

        // ✅ Find by ID only (remove createdBy restriction if single admin)
        const job = await Job.findById(id);

        if (!job) return res.status(404).json({ message: "Job not found" });

        // ✅ Update fields dynamically
        Object.assign(job, {
            ...(title && { title }),
            ...(description && { description }),
            ...(location && { location }),
            ...(salaryRange && { salaryRange }),
            ...(experienceRequired && { experienceRequired }),
            ...(employmentType && { employmentType }),
            ...(isActive !== undefined && { isActive }),
        });

        await job.save();

        res.status(200).json({ message: "Job updated successfully", job });
    } catch (error) {
        console.error("Update job posting error:", error);
        res.status(500).json({ message: error.message || "Server error" });
    }
};

// ====== GET SINGLE JOB ======
export const getSingleAdminJob = async (req, res) => {
    try {
        if (!req.user || !req.user.id)
            return res
                .status(401)
                .json({ message: "Not authorized, please log in" });

        const admin = await Admin.findById(req.user.id);
        if (!admin)
            return res.status(403).json({
                message: "Only registered admins can view job details",
            });

        const { id } = req.params;

        const job = await Job.findById(id);

        if (!job) return res.status(404).json({ message: "Job not found" });

        res.status(200).json({ job });
    } catch (error) {
        console.error("Get single admin job error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ====== GET CANDIDATE RESUME ======
// ====== GET CANDIDATE RESUME ======
export const getCandidateResume = async (req, res) => {
    try {
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({ 
                success: false,
                message: "Only admins can access resumes" 
            });
        }

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid application ID" 
            });
        }

        const application = await JobApplication.findById(id);
        if (!application) {
            return res.status(404).json({ 
                success: false,
                message: "Application not found" 
            });
        }

        const candidateId = application.candidate;
        if (!candidateId) {
            return res.status(404).json({
                success: false,
                message: "Candidate not linked to this application",
            });
        }

        const candidate = await CareerApplication.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: "Candidate record not found",
            });
        }

        const resume = candidate.resume;
        if (!resume?.url) {
            return res.status(404).json({
                success: false,
                message: "Resume not uploaded or unavailable",
            });
        }

        // Redirect to Cloudinary URL for download
        return res.redirect(resume.url);
    } catch (error) {
        console.error("Error fetching candidate resume:", error);
        return res.status(500).json({ 
            success: false,
            message: "Server error",
            error: error.message 
        });
    }
};
