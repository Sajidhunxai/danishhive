import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@talentforge.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
};

export const sendRegistrationEmail = async (
  email: string,
  fullName: string,
  role: string,
  confirmationUrl: string
): Promise<boolean> => {
  const isFreelancer = role === 'freelancer';
  const roleText = isFreelancer ? 'freelancer' : 'klient';

  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
      <div style="background: linear-gradient(135deg, #007cba, #0056b3); padding: 40px 20px; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Velkommen til Danish Hive!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Danmarks førende freelancer platform</p>
      </div>
      
      <div style="padding: 40px 20px;">
        <p style="font-size: 18px; color: #333; margin-bottom: 20px;">Hej ${fullName}!</p>
        
        <p style="color: #555; margin-bottom: 20px;">
          Tak fordi du har valgt at blive del af Danish Hive som ${roleText}.
        </p>
        
        <p style="color: #555; margin-bottom: 30px;">
          For at komme i gang skal du bekræfte din email adresse ved at klikke på knappen nedenfor:
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${confirmationUrl}" 
             style="background: linear-gradient(135deg, #007cba, #0056b3); 
                    color: white; 
                    padding: 16px 32px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold; 
                    font-size: 16px;">
            Bekræft din konto
          </a>
        </div>
      </div>
    </div>
  `;

  return await sendEmail(email, `Velkommen til Danish Hive - Bekræft din ${roleText} konto`, html);
};

export const sendEmailVerification = async (
  email: string,
  verificationLink: string
): Promise<boolean> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2>Bekræft din email adresse</h2>
      <p>Klik på linket nedenfor for at bekræfte din email:</p>
      <a href="${verificationLink}" style="display: inline-block; padding: 12px 24px; background: #007cba; color: white; text-decoration: none; border-radius: 4px;">
        Bekræft Email
      </a>
    </div>
  `;

  return await sendEmail(email, 'Bekræft din email - Danish Hive', html);
};

export const sendPasswordReset = async (
  email: string,
  resetLink: string
): Promise<boolean> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <h2>Nulstil din adgangskode</h2>
      <p>Klik på linket nedenfor for at nulstille din adgangskode:</p>
      <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #007cba; color: white; text-decoration: none; border-radius: 4px;">
        Nulstil Adgangskode
      </a>
      <p style="margin-top: 20px; color: #666;">Dette link udløber om 1 time.</p>
    </div>
  `;

  return await sendEmail(email, 'Nulstil din adgangskode - Danish Hive', html);
};

export const sendMessageNotification = async (
  recipientEmail: string,
  recipientName: string,
  senderName: string,
  messageContent: string
): Promise<boolean> => {
  const truncatedMessage = messageContent.length > 150 
    ? messageContent.substring(0, 150) + '...' 
    : messageContent;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2>Du har fået en ny besked!</h2>
      <p>Hej ${recipientName},</p>
      <p><strong>${senderName}</strong> har sendt dig en besked:</p>
      <blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007cba;">
        "${truncatedMessage}"
      </blockquote>
      <a href="${process.env.FRONTEND_URL}/messages" 
         style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #007cba; color: white; text-decoration: none; border-radius: 4px;">
        Læs og svar på besked
      </a>
    </div>
  `;

  return await sendEmail(recipientEmail, `Ny besked fra ${senderName} - Danish Hive`, html);
};

