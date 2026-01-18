import dotenv from 'dotenv';
dotenv.config();

export const smsConfig = {
  apiKey: process.env.SMS_GATEWAY_API_KEY,
  senderId: process.env.SMS_GATEWAY_SENDER_ID,
  baseUrl: 'https://www.smsgatewayhub.com/api/mt/SendSMS',
  channel: 2,
  dcs: 0,
  flashsms: 0,
  route: 1
};

export const otpConfig = {
  expiryTime: 5 * 60 * 1000, // 5 minutes
  otpLength: 6,
  maxAttempts: 3,
  resendDelay: 60 * 1000 // 1 minute
};

// SMS Templates (without {#var#} - we'll replace it dynamically)
export const smsTemplates = {
  login: "Your OTP for login verification is {#var#}. Please do not share this OTP with anyone for security reasons. CONCEPT PROMOTIONS AND EVENTS",
  verification: "Your OTP for mobile number verification is {#var#}. Please do not share this OTP with anyone for security reasons. CONCEPT PROMOTIONS AND EVENTS"
};
