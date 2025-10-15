import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    return true;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
};

export const sendVerificationCode = async (
  phoneNumber: string,
  code: string
): Promise<boolean> => {
  const message = `Din Danish Hive verificeringskode er: ${code}. Koden udløber om 10 minutter.`;
  return await sendSMS(phoneNumber, message);
};

