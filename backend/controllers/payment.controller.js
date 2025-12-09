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
