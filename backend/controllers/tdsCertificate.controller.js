// controllers/tdsCertificate.controller.js
import mongoose from "mongoose";
import { TDSCertificate } from "../models/tdsCertificate.model.js";
import { Retailer } from "../models/retailer.model.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.config.js";
import { getResourceType } from "../utils/cloudinary.helper.js";

// ✅ UPLOAD TDS CERTIFICATE (Admin Only)
export const uploadTDSCertificate = async (req, res) => {
    try {
        // Admin check
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can upload TDS certificates",
            });
        }

        const {
            retailerId,
            financialYear,
            quarter,
            totalTDSAmount,
            certificateNumber,
            remarks,
        } = req.body;

        // Validation
        if (!retailerId || !financialYear || !quarter || !totalTDSAmount) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: retailerId, financialYear, quarter, totalTDSAmount",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Certificate file is required",
            });
        }

        // Validate retailer exists
        const retailer = await Retailer.findById(retailerId);
        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer not found",
            });
        }

        // Check if certificate already exists for this quarter
        const existingCert = await TDSCertificate.findOne({
            retailerId,
            financialYear,
            quarter,
            status: 'active',
        });

        if (existingCert) {
            return res.status(400).json({
                success: false,
                message: `TDS certificate for ${quarter} ${financialYear} already exists. Please delete or replace it first.`,
            });
        }

        // Upload certificate to Cloudinary
        const uploadResult = await uploadToCloudinary(
            req.file.buffer,
            "tds_certificates",
            getResourceType(req.file.mimetype)
        );

        // Get quarter date range
        const quarterPeriod = TDSCertificate.getQuarterDateRange(quarter, financialYear);

        // Create certificate document
        const certificate = new TDSCertificate({
            retailerId,
            retailerName: retailer.name,
            outletCode: retailer.uniqueId,
            financialYear,
            quarter,
            quarterPeriod,
            totalTDSAmount: parseFloat(totalTDSAmount),
            certificateNumber: certificateNumber || "",
            certificate: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            },
            uploadedBy: req.user.id,
            remarks: remarks || "",
        });

        await certificate.save();

        res.status(201).json({
            success: true,
            message: "TDS certificate uploaded successfully",
            certificate,
        });
    } catch (error) {
        console.error("Error uploading TDS certificate:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload TDS certificate",
            error: error.message,
        });
    }
};

// ✅ GET ALL CERTIFICATES FOR A RETAILER
export const getRetailerCertificates = async (req, res) => {
    try {
        const { retailerId } = req.params;
        const { financialYear, quarter } = req.query;

        if (!mongoose.Types.ObjectId.isValid(retailerId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid retailer ID",
            });
        }

        const filter = { 
            retailerId,
            status: 'active',
        };
        
        if (financialYear) filter.financialYear = financialYear;
        if (quarter) filter.quarter = quarter;

        const certificates = await TDSCertificate.find(filter)
            .populate("uploadedBy", "name email")
            .sort({ financialYear: -1, quarter: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            certificates,
        });
    } catch (error) {
        console.error("Error fetching certificates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificates",
            error: error.message,
        });
    }
};

// ✅ GET ALL CERTIFICATES (Admin - with filters)
export const getAllCertificates = async (req, res) => {
    try {
        // Admin check
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can view all certificates",
            });
        }

        const { financialYear, quarter, state, outletCode } = req.query;

        const filter = { status: 'active' };
        
        if (financialYear) filter.financialYear = financialYear;
        if (quarter) filter.quarter = quarter;
        if (outletCode) filter.outletCode = outletCode;

        const certificates = await TDSCertificate.find(filter)
            .populate("retailerId", "name uniqueId shopDetails")
            .populate("uploadedBy", "name email")
            .sort({ uploadedAt: -1 });

        // Filter by state if provided
        let filteredCerts = certificates;
        if (state) {
            filteredCerts = certificates.filter(cert => 
                cert.retailerId?.shopDetails?.shopAddress?.state === state
            );
        }

        res.status(200).json({
            success: true,
            count: filteredCerts.length,
            certificates: filteredCerts,
        });
    } catch (error) {
        console.error("Error fetching all certificates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificates",
            error: error.message,
        });
    }
};

// ✅ GET SINGLE CERTIFICATE BY ID
export const getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(certificateId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid certificate ID",
            });
        }

        const certificate = await TDSCertificate.findById(certificateId)
            .populate("retailerId", "name uniqueId shopDetails")
            .populate("uploadedBy", "name email");

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        // Authorization check
        if (req.user.role === "retailer" && certificate.retailerId._id.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "You can only view your own certificates",
            });
        }

        res.status(200).json({
            success: true,
            certificate,
        });
    } catch (error) {
        console.error("Error fetching certificate:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificate",
            error: error.message,
        });
    }
};

// ✅ UPDATE CERTIFICATE (Replace file or update details)
export const updateCertificate = async (req, res) => {
    try {
        // Admin check
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can update certificates",
            });
        }

        const { certificateId } = req.params;
        const { totalTDSAmount, certificateNumber, remarks } = req.body;

        const certificate = await TDSCertificate.findById(certificateId);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        // Update file if provided
        if (req.file) {
            // Delete old file from Cloudinary
            await deleteFromCloudinary(
                certificate.certificate.publicId,
                getResourceType(req.file.mimetype)
            );

            // Upload new file
            const uploadResult = await uploadToCloudinary(
                req.file.buffer,
                "tds_certificates",
                getResourceType(req.file.mimetype)
            );

            certificate.certificate = {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
            };
        }

        // Update other fields
        if (totalTDSAmount !== undefined) certificate.totalTDSAmount = parseFloat(totalTDSAmount);
        if (certificateNumber !== undefined) certificate.certificateNumber = certificateNumber;
        if (remarks !== undefined) certificate.remarks = remarks;

        await certificate.save();

        res.status(200).json({
            success: true,
            message: "Certificate updated successfully",
            certificate,
        });
    } catch (error) {
        console.error("Error updating certificate:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update certificate",
            error: error.message,
        });
    }
};

// ✅ DELETE CERTIFICATE
export const deleteCertificate = async (req, res) => {
    try {
        // Admin check
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Only admins can delete certificates",
            });
        }

        const { certificateId } = req.params;

        const certificate = await TDSCertificate.findById(certificateId);

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found",
            });
        }

        // Delete file from Cloudinary
        await deleteFromCloudinary(certificate.certificate.publicId, 'auto');

        // Soft delete (mark as deleted instead of removing)
        certificate.status = 'deleted';
        await certificate.save();

        res.status(200).json({
            success: true,
            message: "Certificate deleted successfully",
        });
    } catch (error) {
        console.error("Error deleting certificate:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete certificate",
            error: error.message,
        });
    }
};

// ✅ GET CERTIFICATES FOR LOGGED-IN RETAILER
export const getMyTDSCertificates = async (req, res) => {
    try {
        // Retailer check
        if (!req.user || req.user.role !== "retailer") {
            return res.status(403).json({
                success: false,
                message: "Only retailers can access this endpoint",
            });
        }

        const { financialYear, quarter } = req.query;

        const filter = { 
            retailerId: req.user.id,
            status: 'active',
        };
        
        if (financialYear) filter.financialYear = financialYear;
        if (quarter) filter.quarter = quarter;

        const certificates = await TDSCertificate.find(filter)
            .sort({ financialYear: -1, quarter: -1 });

        res.status(200).json({
            success: true,
            count: certificates.length,
            certificates,
        });
    } catch (error) {
        console.error("Error fetching my certificates:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch certificates",
            error: error.message,
        });
    }
};
