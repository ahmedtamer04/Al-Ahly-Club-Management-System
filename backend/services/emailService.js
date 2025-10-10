import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Configure email transporter (using Gmail as example)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // Use app password, not regular password
  }
});

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const sendVerificationEmail = async (email, token, userRole, userName) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'GUC Al-Ahly - Complete Your Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">Welcome to GUC Al-Ahly Club!</h2>
        <p>Dear ${userName},</p>
        <p>Your <strong>${userRole}</strong> account has been approved by the administrator.</p>
        <p>Please click the button below to verify your email and complete your registration:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
            Verify Email & Complete Registration
          </a>
        </div>
        
        <p><strong>⚠️ Important:</strong> This link will expire in 24 hours.</p>
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
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};