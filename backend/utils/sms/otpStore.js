// In-memory store (use Redis in production)
class OTPStore {
    constructor() {
        this.store = new Map();
    }

    // Save OTP with metadata
    save(phone, otp, expiresAt) {
        this.store.set(phone, {
            otp,
            expiresAt,
            attempts: 0,
            createdAt: Date.now(),
        });
    }

    setResetFlag(phone, value) {
        const data = this.store.get(phone);
        if (data) {
            data.isPasswordReset = value;
        }
    }

    isPasswordReset(phone) {
        const data = this.store.get(phone);
        return data?.isPasswordReset || false;
    }

    // Get OTP data
    get(phone) {
        return this.store.get(phone);
    }

    // Delete OTP
    delete(phone) {
        this.store.delete(phone);
    }

    // Increment verification attempts
    incrementAttempts(phone) {
        const data = this.store.get(phone);
        if (data) {
            data.attempts += 1;
            this.store.set(phone, data);
        }
    }

    // Check if OTP is expired
    isExpired(phone) {
        const data = this.store.get(phone);
        if (!data) return true;
        return Date.now() > data.expiresAt;
    }

    setUserType(phone, userType) {
        const data = this.store.get(phone);
        if (data) {
            data.userType = userType;
        }
    }

    getUserType(phone) {
        const data = this.store.get(phone);
        return data?.userType || null;
    }

    // Clean expired OTPs periodically
    cleanExpired() {
        const now = Date.now();
        for (const [phone, data] of this.store.entries()) {
            if (now > data.expiresAt) {
                this.store.delete(phone);
            }
        }
    }
}

export const otpStore = new OTPStore();

// Clean expired OTPs every 5 minutes
setInterval(
    () => {
        otpStore.cleanExpired();
    },
    5 * 60 * 1000,
);
