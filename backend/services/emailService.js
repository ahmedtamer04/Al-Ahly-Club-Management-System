import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
  // Alternative: Use other email services like:
  // - SendGrid, Mailgun, Outlook, etc.
  // - Or SMTP configuration for other providers
});

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (email, token, userRole, userName, isStudent = false) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  // Different email content for students vs staff/TA/professor
  const emailContent = isStudent ? {
    subject: 'GUC Al-Ahly - Verify Your Email',
    greeting: 'Welcome to GUC Al-Ahly Club!',
    message: `
      <p>Dear ${userName},</p>
      <p>Thank you for registering as a <strong>${userRole}</strong> with GUC Al-Ahly Club.</p>
      <p>Please click the button below to verify your email address and complete your registration:</p>
    `,
    note: `<p><strong>⚠️ Important:</strong> You won't be able to log in until you verify your email. This link will expire in 24 hours.</p>`
  } : {
    subject: 'GUC Al-Ahly - Your Account Has Been Approved',
    greeting: 'Your Account Has Been Approved!',
    message: `
      <p>Dear ${userName},</p>
      <p>Great news! Your <strong>${userRole}</strong> account has been approved by the administrator.</p>
      <p>Please click the button below to verify your email and complete your registration:</p>
    `,
    note: `<p><strong>⚠️ Important:</strong> You must verify your email to log in. This link will expire in 24 hours.</p>`
  };
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: emailContent.subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">${emailContent.greeting}</h2>
        ${emailContent.message}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email & Complete Registration
          </a>
        </div>
        
        ${emailContent.note}
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #7f8c8d;">${verificationUrl}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
        <p style="color: #95a5a6; font-size: 12px;">
          If you didn't request this account, please ignore this email.<br>
          GUC Al-Ahly Club Management System
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};