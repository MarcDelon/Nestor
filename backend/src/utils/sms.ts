import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

let client: any = null;
if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
}

export const sendSMS = async (to: string, body: string): Promise<boolean> => {
  if (!client || !fromNumber) {
    console.log(`[SMS] Twilio not configured. Skipping SMS to ${to}: ${body.slice(0, 80)}...`);
    return false;
  }

  // Normalize Cameroon phone numbers
  let normalized = to.replace(/\s+/g, '');
  if (normalized.startsWith('6') && normalized.length === 9) {
    normalized = '+237' + normalized;
  } else if (normalized.startsWith('237') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }

  try {
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalized,
    });
    console.log(`[SMS] Sent to ${normalized}: ${message.sid}`);
    return true;
  } catch (error: any) {
    console.error(`[SMS] Error sending to ${normalized}:`, error.message);
    return false;
  }
};
