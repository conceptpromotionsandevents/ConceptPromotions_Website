import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

// Load environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = process.env.TO_TEST_NUMBER || "+919310040629"; // replace with your phone number for testing

console.log("Twilio credentials:");
console.log("SID:", accountSid ? "✅ loaded" : "❌ missing");
console.log("Auth Token:", authToken ? "✅ loaded" : "❌ missing");
console.log("From Number:", fromNumber ? "✅ loaded" : "❌ missing");
console.log("To Number:", toNumber ? "✅ set" : "❌ missing");

if (!accountSid || !authToken || !fromNumber) {
  console.error("❌ Twilio credentials are not set correctly in your .env file");
  process.exit(1);
}

// Initialize Twilio client
const client = twilio(accountSid, authToken);

// Send test SMS
(async () => {
  try {
    const message = await client.messages.create({
      body: "Hello! This is a test SMS from Twilio.",
      from: fromNumber,
      to: toNumber,
    });
    console.log("✅ SMS sent successfully! SID:", message.sid);
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.message);
    if (error.code) console.error("Twilio error code:", error.code);
  }
})();
