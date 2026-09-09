const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const sendOtpSms = async (contact, otp) => {
  // Indian 10-digit number ko E.164 format mein convert karo
  const formattedNumber = contact.startsWith("+") ? contact : `+91${contact}`;

  await client.messages.create({
    body: `Your Talkify verification code is ${otp}. Valid for 5 minutes. Do not share this with anyone.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: formattedNumber,
  });
};

module.exports = { sendOtpSms };