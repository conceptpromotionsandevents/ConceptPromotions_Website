import { smsConfig, otpConfig, smsTemplates } from '../utils/sms/smsConfig.js';
import { otpStore } from '../utils/sms/otpStore.js';

// Generate random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS via Gateway (UPDATED)
const sendSMS = async (phone, otp, templateType = 'verification') => {
  try {
    // Get the template
    const template = smsTemplates[templateType];
    
    // Replace {#var#} with actual OTP
    const message = template.replace('{#var#}', otp);
    
    // Build URL with proper encoding
    const url = new URL(smsConfig.baseUrl);
    url.searchParams.append('APIKey', smsConfig.apiKey);
    url.searchParams.append('senderid', smsConfig.senderId);
    url.searchParams.append('channel', smsConfig.channel);
    url.searchParams.append('DCS', smsConfig.dcs);
    url.searchParams.append('flashsms', smsConfig.flashsms);
    url.searchParams.append('number', `91${phone}`);
    url.searchParams.append('text', message); // URLSearchParams automatically encodes
    url.searchParams.append('route', smsConfig.route);

    console.log('Sending SMS to:', `91${phone}`);
    
    const response = await fetch(url.toString());
    const data = await response.text();
    
    console.log('SMS Gateway Response:', data);
    
    // Parse response
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(data);
    } catch (e) {
      jsonResponse = { response: data };
    }
    
    // Check for errors
    if (jsonResponse.ErrorCode && jsonResponse.ErrorCode !== "000") {
      throw new Error(jsonResponse.ErrorMessage || 'SMS sending failed');
    }
    
    return { success: true, data: jsonResponse };
    
  } catch (error) {
    console.error('SMS Error:', error);
    throw error;
  }
};

// Controller: Send OTP (UPDATED)
export const sendOTP = async (req, res) => {
  try {
    const { phone, type = 'verification' } = req.body; // type can be 'login' or 'verification'

    // Validate phone number (must be 10 digits)
    if (!phone || !/^\d{10}$/.test(phone.toString().trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number (without country code)'
      });
    }

    // Validate template type
    if (!smsTemplates[type]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid template type'
      });
    }

    // Clean phone number (remove any spaces or special characters)
    const cleanPhone = phone.toString().trim().replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be exactly 10 digits'
      });
    }

    // Check for recent OTP request (rate limiting)
    const existingOTP = otpStore.get(cleanPhone);
    if (existingOTP && !otpStore.isExpired(cleanPhone)) {
      const timeSinceCreation = Date.now() - existingOTP.createdAt;
      if (timeSinceCreation < otpConfig.resendDelay) {
        const waitTime = Math.ceil((otpConfig.resendDelay - timeSinceCreation) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP`
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + otpConfig.expiryTime;

    // Send SMS with template type
    const smsResult = await sendSMS(cleanPhone, otp, type);
    
    if (!smsResult.success) {
      throw new Error('Failed to send SMS');
    }

    // Store OTP
    otpStore.save(cleanPhone, otp, expiresAt);

    // Log OTP in development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ OTP for ${cleanPhone}: ${otp}`);
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: otpConfig.expiryTime / 1000, // in seconds
      ...(process.env.NODE_ENV === 'development' && { otp }) // Only in dev
    });

  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP. Please try again later.'
    });
  }
};

// Controller: Verify OTP (No changes needed)
export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Clean and validate phone number
    const cleanPhone = phone?.toString().trim().replace(/\D/g, '');
    
    if (!cleanPhone || cleanPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number'
      });
    }

    if (!otp || otp.length !== otpConfig.otpLength) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format'
      });
    }

    // Get stored OTP
    const storedData = otpStore.get(cleanPhone);

    if (!storedData) {
      return res.status(404).json({
        success: false,
        message: 'OTP not found. Please request a new one.'
      });
    }

    // Check expiry
    if (otpStore.isExpired(cleanPhone)) {
      otpStore.delete(cleanPhone);
      return res.status(410).json({
        success: false,
        message: 'OTP expired. Please request a new one.'
      });
    }

    // Check max attempts
    if (storedData.attempts >= otpConfig.maxAttempts) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({
        success: false,
        message: 'Maximum verification attempts exceeded. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      otpStore.incrementAttempts(cleanPhone);
      const remainingAttempts = otpConfig.maxAttempts - (storedData.attempts + 1);
      
      return res.status(401).json({
        success: false,
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      });
    }

    // Success - delete OTP
    otpStore.delete(cleanPhone);

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully'
    });

  } catch (error) {
    console.error('Verify OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed. Please try again.'
    });
  }
};

// Controller: Resend OTP (UPDATED)
export const resendOTP = async (req, res) => {
  try {
    const { phone, type = 'verification' } = req.body;

    // Clean phone
    const cleanPhone = phone?.toString().trim().replace(/\D/g, '');
    
    // Delete existing OTP
    otpStore.delete(cleanPhone);

    // Call sendOTP logic
    return sendOTP(req, res);

  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP'
    });
  }
};
