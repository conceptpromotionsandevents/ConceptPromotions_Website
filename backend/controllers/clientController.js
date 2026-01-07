import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ClientAdmin, ClientUser, Campaign } from "../models/user.js";
import mongoose from "mongoose";


export const loginClientAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await ClientAdmin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Client Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, role: "client_admin" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, admin });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const loginClientUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await ClientUser.findOne({ email });
    if (!user) return res.status(404).json({ message: "Client User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: "client_user" },
      process.env.JWT_SECRET || "supremeSecretKey",
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* ===========================
   GET ALL CAMPAIGNS FOR CLIENT
=========================== */
export const getClientCampaigns = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    console.log("📊 Campaigns - User ID:", userId, "Role:", role);

    if (!["client_admin", "client_user"].includes(role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let organizationName;

    // Client Admin
    if (role === "client_admin") {
      const admin = await ClientAdmin.findById(userId);
      if (!admin)
        return res.status(404).json({ message: "Client Admin not found" });

      organizationName = admin.organizationName;
    }

    // Client User
    if (role === "client_user") {
      const user = await ClientUser.findById(userId).populate(
        "parentClientAdmin"
      );
      if (!user || !user.parentClientAdmin)
        return res
          .status(404)
          .json({ message: "Parent Client Admin not found" });

      organizationName = user.parentClientAdmin.organizationName;
    }

    if (!organizationName) {
      return res.status(404).json({ message: "Organization name not found" });
    }

    /* =========================
       FETCH CAMPAIGNS
       ✅ ADDED: info, gratification
       (no other changes)
    ========================== */
    const campaigns = await Campaign.find({ client: organizationName })
      .select(
        "name type regions states isActive info gratification assignedRetailers assignedEmployees assignedEmployeeRetailers campaignStartDate campaignEndDate createdAt"
      )
      .populate({
        path: "assignedRetailers.retailerId",
        select:
          "name contactNo email shopDetails.shopName shopDetails.shopAddress shopDetails.businessType retailerCode uniqueId",
      })
      .populate({
        path: "assignedEmployees.employeeId",
        select: "name email phone position employeeId isActive",
      })
      .populate({
        path: "assignedEmployeeRetailers.employeeId",
        select: "name email phone employeeId",
      })
      .populate({
        path: "assignedEmployeeRetailers.retailerId",
        select: "name contactNo shopDetails.shopName retailerCode",
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log("📊 Found campaigns:", campaigns.length);

    /* =========================
       ENRICH CAMPAIGNS
       (UNCHANGED)
    ========================== */
    const enrichedCampaigns = campaigns.map((campaign) => {
      const totalOutletsAssigned = campaign.assignedRetailers?.length || 0;

      const totalOutletsAccepted =
        campaign.assignedRetailers?.filter(
          (r) => r.status === "accepted"
        ).length || 0;

      const totalOutletsPending =
        campaign.assignedRetailers?.filter(
          (r) => r.status === "pending"
        ).length || 0;

      const totalOutletsRejected =
        campaign.assignedRetailers?.filter(
          (r) => r.status === "rejected"
        ).length || 0;

      const totalEmployeesAssigned =
        campaign.assignedEmployees?.length || 0;

      const totalEmployeesAccepted =
        campaign.assignedEmployees?.filter(
          (e) => e.status === "accepted"
        ).length || 0;

      const totalEmployeesPending =
        campaign.assignedEmployees?.filter(
          (e) => e.status === "pending"
        ).length || 0;

      const retailers =
        campaign.assignedRetailers?.map((r) => ({
          retailerId: r.retailerId?._id,
          retailerName: r.retailerId?.name,
          retailerCode: r.retailerId?.retailerCode,
          uniqueId: r.retailerId?.uniqueId,
          contactNo: r.retailerId?.contactNo,
          email: r.retailerId?.email,
          shopName: r.retailerId?.shopDetails?.shopName,
          businessType: r.retailerId?.shopDetails?.businessType,
          city: r.retailerId?.shopDetails?.shopAddress?.city,
          state: r.retailerId?.shopDetails?.shopAddress?.state,
          pincode: r.retailerId?.shopDetails?.shopAddress?.pincode,
          status: r.status,
          assignedAt: r.assignedAt,
          startDate: r.startDate,
          endDate: r.endDate,
        })) || [];

      const employees =
        campaign.assignedEmployees?.map((e) => ({
          employeeId: e.employeeId?._id,
          employeeName: e.employeeId?.name,
          employeeCode: e.employeeId?.employeeId,
          email: e.employeeId?.email,
          phone: e.employeeId?.phone,
          position: e.employeeId?.position,
          isActive: e.employeeId?.isActive,
          status: e.status,
          assignedAt: e.assignedAt,
          startDate: e.startDate,
          endDate: e.endDate,
        })) || [];

      const employeeRetailerMapping =
        campaign.assignedEmployeeRetailers?.map((mapping) => ({
          employeeId: mapping.employeeId?._id,
          employeeName: mapping.employeeId?.name,
          employeeCode: mapping.employeeId?.employeeId,
          employeePhone: mapping.employeeId?.phone,

          retailerId: mapping.retailerId?._id,
          retailerName: mapping.retailerId?.name,
          retailerCode: mapping.retailerId?.retailerCode,
          shopName: mapping.retailerId?.shopDetails?.shopName,
          retailerContact: mapping.retailerId?.contactNo,

          assignedAt: mapping.assignedAt,
        })) || [];

      const employeeWiseRetailers = {};
      employeeRetailerMapping.forEach((mapping) => {
        const empId = mapping.employeeId;
        if (!employeeWiseRetailers[empId]) {
          employeeWiseRetailers[empId] = {
            employeeId: mapping.employeeId,
            employeeName: mapping.employeeName,
            employeeCode: mapping.employeeCode,
            retailers: [],
          };
        }
        employeeWiseRetailers[empId].retailers.push({
          retailerId: mapping.retailerId,
          retailerName: mapping.retailerName,
          retailerCode: mapping.retailerCode,
          shopName: mapping.shopName,
          assignedAt: mapping.assignedAt,
        });
      });

      const retailerWiseEmployees = {};
      employeeRetailerMapping.forEach((mapping) => {
        const retId = mapping.retailerId;
        if (!retailerWiseEmployees[retId]) {
          retailerWiseEmployees[retId] = {
            retailerId: mapping.retailerId,
            retailerName: mapping.retailerName,
            retailerCode: mapping.retailerCode,
            shopName: mapping.shopName,
            employees: [],
          };
        }
        retailerWiseEmployees[retId].employees.push({
          employeeId: mapping.employeeId,
          employeeName: mapping.employeeName,
          employeeCode: mapping.employeeCode,
          assignedAt: mapping.assignedAt,
        });
      });

      return {
        ...campaign,

        totalOutletsAssigned,
        totalOutletsAccepted,
        totalOutletsPending,
        totalOutletsRejected,

        totalEmployeesAssigned,
        totalEmployeesAccepted,
        totalEmployeesPending,

        retailers,
        employees,

        employeeRetailerMapping,
        employeeWiseRetailers: Object.values(employeeWiseRetailers),
        retailerWiseEmployees: Object.values(retailerWiseEmployees),

        totalEmployeeRetailerMappings: employeeRetailerMapping.length,
      };
    });

    return res.status(200).json({
      message: "Client campaigns fetched successfully",
      totalCampaigns: enrichedCampaigns.length,
      campaigns: enrichedCampaigns,
    });
  } catch (err) {
    console.error("❌ Client campaign fetch error:", err);
    return res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};
