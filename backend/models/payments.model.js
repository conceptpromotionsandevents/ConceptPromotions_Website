import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
    {
        client: {
            type: String,
            ref: "ClientAdmin", // or whatever your client model is named
            required: true,
        },
        retailer: {
            type: String,
            ref: "Retailer",
            required: true,
        },
        campaign: {
            type: String,
            ref: "Campaign",
            required: true,
        },
        shopName: {
            type: String,
            required: true,
            trim: true,
        },
        outletCode: {
            type: String,
            required: true,
            trim: true,
        },
        paymentAmount: {
            type: Number,
            required: true,
            min: [0, "Payment amount must be positive"],
        },
        utrNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        paymentDate: {
            type: Date,
            required: true,
        },
        createdBy: {
            type: String,
            ref: "Admin",
            required: true,
        },
        remarks: {
            type: String,
            trim: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Index for better query performance
paymentTransactionSchema.index({ campaign: 1, paymentDate: -1 });
paymentTransactionSchema.index({ retailer: 1, paymentDate: -1 });
paymentTransactionSchema.index({ utrNumber: 1 });

// Virtual for formatted date (dd/mm/yyyy)
paymentTransactionSchema.virtual("formattedDate").get(function () {
    const date = this.paymentDate;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
});

const PaymentTransaction = mongoose.model(
    "PaymentTransaction",
    paymentTransactionSchema
);

export default PaymentTransaction;
