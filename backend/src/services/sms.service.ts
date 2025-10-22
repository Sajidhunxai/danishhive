import twilio from 'twilio';

// Lazy initialization to prevent crashes if Twilio credentials are not configured
let client: ReturnType<typeof twilio> | null = null;

const getTwilioClient = () => {
  if (client) {
    return client;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // Validate Twilio credentials
  if (!accountSid || !authToken || !accountSid.startsWith('AC')) {
    console.warn('Twilio credentials not properly configured. SMS functionality will be disabled.');
    return null;
  }

  try {
    client = twilio(accountSid, authToken);
    return client;
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
    return null;
  }
};

export const sendSMS = async (
  phoneNumber: string,
  message: string
): Promise<boolean> => {
  try {
    const twilioClient = getTwilioClient();
    
    if (!twilioClient) {
      console.warn('SMS service not available - Twilio not configured');
      return false;
    }

    await twilioClient.messages.create({
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

