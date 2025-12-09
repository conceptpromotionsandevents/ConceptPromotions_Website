import PaymentTransaction from "../models/payments.model.js";

/* ======================================================
   CREATE PAYMENT TRANSACTION
====================================================== */
export const createPaymentTransaction = async (req, res) => {
    try {
        const {
            client,
            retailer,
            campaign,
            shopName,
            outletCode,
            paymentAmount,
            utrNumber,
            paymentDate, // expected format: "dd/mm/yyyy"
            remarks,
        } = req.body;

        // Authorization check
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can add payments" });
        }

        // Validate required fields
        if (
            !client ||
            !retailer ||
            !campaign ||
            !shopName ||
            !outletCode ||
            !paymentAmount ||
            !utrNumber ||
            !paymentDate
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Validate payment amount
        const amount = Number(paymentAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            return res
                .status(400)
                .json({ message: "Payment amount must be a positive number" });
        }

        // Validate and parse date (dd/mm/yyyy)
        const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
        if (!dateRegex.test(paymentDate)) {
            return res.status(400).json({
                message: "Date must be in dd/mm/yyyy format",
            });
        }

        const [day, month, year] = paymentDate.split("/");
        const parsedDate = new Date(`${year}-${month}-${day}`);

        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "Invalid date provided" });
        }

        // Check for duplicate UTR
        const existingUTR = await PaymentTransaction.findOne({
            utrNumber: utrNumber.trim(),
            isDeleted: false,
        });

        if (existingUTR) {
            return res.status(400).json({
                message: "UTR number already exists in the system",
            });
        }

        // Create payment transaction
        const payment = await PaymentTransaction.create({
            client: client.trim(),
            retailer: retailer.trim(),
            campaign: campaign.trim(),
            shopName: shopName.trim(),
            outletCode: outletCode.trim(),
            paymentAmount: amount,
            utrNumber: utrNumber.trim(),
            paymentDate: parsedDate,
            remarks: remarks?.trim() || "",
        });

        res.status(201).json({
            message: "Payment transaction created successfully",
            payment,
        });
    } catch (error) {
        console.error("Create payment error:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message,
        });
    }
};

/* ======================================================
   GET ALL PAYMENT TRANSACTIONS (WITH FILTERS)
====================================================== */
export const getAllPaymentTransactions = async (req, res) => {
    try {
        const {
            campaign,
            retailer,
            client,
            startDate,
            endDate,
            utrNumber,
            page = 1,
            limit = 50,
        } = req.query;

        // Authorization check
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Build filter
        const filter = { isDeleted: false };

        if (campaign) filter.campaign = new RegExp(campaign, "i");
        if (retailer) filter.retailer = new RegExp(retailer, "i");
        if (client) filter.client = new RegExp(client, "i");
        if (utrNumber) filter.utrNumber = new RegExp(utrNumber, "i");

        // Date range filter
        if (startDate || endDate) {
            filter.paymentDate = {};
            if (startDate) {
                const [day, month, year] = startDate.split("/");
                filter.paymentDate.$gte = new Date(`${year}-${month}-${day}`);
            }
            if (endDate) {
                const [day, month, year] = endDate.split("/");
                filter.paymentDate.$lte = new Date(
                    `${year}-${month}-${day}T23:59:59`
                );
            }
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const [payments, total] = await Promise.all([
            PaymentTransaction.find(filter)
                .sort({ paymentDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            PaymentTransaction.countDocuments(filter),
        ]);

        res.status(200).json({
            payments,
            pagination: {
                total,
                page: Number(page),
                pages: Math.ceil(total / Number(limit)),
                limit: Number(limit),
            },
        });
    } catch (error) {
        console.error("Get payments error:", error);
        res.status(500).json({ message: error.message });
    }
};

/* ======================================================
   GET SINGLE PAYMENT TRANSACTION BY ID
====================================================== */
export const getPaymentTransactionById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const payment = await PaymentTransaction.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json({ payment });
    } catch (error) {
        console.error("Get payment by ID error:", error);
        res.status(500).json({ message: error.message });
    }
};

/* ======================================================
   UPDATE PAYMENT TRANSACTION
====================================================== */
export const updatePaymentTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            client,
            retailer,
            campaign,
            shopName,
            outletCode,
            paymentAmount,
            utrNumber,
            paymentDate,
            remarks,
        } = req.body;

        // Authorization check
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can edit payments" });
        }

        const payment = await PaymentTransaction.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Update client
        if (client !== undefined) {
            payment.client = client.trim();
        }

        // Update retailer
        if (retailer !== undefined) {
            payment.retailer = retailer.trim();
        }

        // Update campaign
        if (campaign !== undefined) {
            payment.campaign = campaign.trim();
        }

        // Update shop name
        if (shopName !== undefined) {
            payment.shopName = shopName.trim();
        }

        // Update outlet code
        if (outletCode !== undefined) {
            payment.outletCode = outletCode.trim();
        }

        // Update payment amount
        if (paymentAmount !== undefined) {
            const amount = Number(paymentAmount);
            if (!Number.isFinite(amount) || amount <= 0) {
                return res
                    .status(400)
                    .json({ message: "Invalid payment amount" });
            }
            payment.paymentAmount = amount;
        }

        // Update UTR number (check for duplicates)
        if (utrNumber && utrNumber.trim() !== payment.utrNumber) {
            const existingUTR = await PaymentTransaction.findOne({
                utrNumber: utrNumber.trim(),
                _id: { $ne: id },
                isDeleted: false,
            });

            if (existingUTR) {
                return res.status(400).json({
                    message: "UTR number already exists",
                });
            }
            payment.utrNumber = utrNumber.trim();
        }

        // Update payment date
        if (paymentDate) {
            const dateRegex = /^\d{2}\/\d{2}\/\d{4}$/;
            if (!dateRegex.test(paymentDate)) {
                return res.status(400).json({
                    message: "Date must be in dd/mm/yyyy format",
                });
            }

            const [day, month, year] = paymentDate.split("/");
            const parsedDate = new Date(`${year}-${month}-${day}`);

            if (isNaN(parsedDate.getTime())) {
                return res
                    .status(400)
                    .json({ message: "Invalid date provided" });
            }

            payment.paymentDate = parsedDate;
        }

        // Update remarks
        if (remarks !== undefined) {
            payment.remarks = remarks.trim();
        }

        await payment.save();

        res.status(200).json({
            message: "Payment updated successfully",
            payment,
        });
    } catch (error) {
        console.error("Update payment error:", error);
        res.status(500).json({ message: error.message });
    }
};

/* ======================================================
   DELETE PAYMENT TRANSACTION (SOFT DELETE)
====================================================== */
export const deletePaymentTransaction = async (req, res) => {
    try {
        const { id } = req.params;

        // Authorization check
        if (!req.user || req.user.role !== "admin") {
            return res
                .status(403)
                .json({ message: "Only admins can delete payments" });
        }

        const payment = await PaymentTransaction.findOne({
            _id: id,
            isDeleted: false,
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        // Soft delete
        payment.isDeleted = true;
        await payment.save();

        res.status(200).json({
            message: "Payment deleted successfully",
        });
    } catch (error) {
        console.error("Delete payment error:", error);
        res.status(500).json({ message: error.message });
    }
};
