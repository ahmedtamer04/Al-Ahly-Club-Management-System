import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter lazily to ensure environment variables are loaded
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    console.log('=== EMAIL SERVICE TRANSPORTER DEBUG ===');
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ NOT SET');
    console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? `✅ Set (length: ${process.env.EMAIL_PASS.length})` : '❌ NOT SET');
    console.log('======================================');
    
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
      // Alternative: Use other email services like:
      // - SendGrid, Mailgun, Outlook, etc.
      // - Or SMTP configuration for other providers
    });
  }
  return transporter;
};

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
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw new Error('Failed to send verification email');
  }
};

export const sendPaymentReceipt = async (email, paymentDetails) => {
  const {
    userName,
    eventName,
    eventType,
    amount,
    paymentMethod,
    transactionId,
    paymentDate,
    registrationId
  } = paymentDetails;

  const formattedDate = new Date(paymentDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const paymentMethodDisplay = paymentMethod === 'wallet' ? '💰 Wallet' : '💳 Credit/Debit Card';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Payment Receipt - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">✅ Payment Successful</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">Payment Receipt</h2>
            <p style="color: #1b5e20; margin: 0; font-size: 14px;">Your payment has been processed successfully.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">Payment Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; width: 40%;">Recipient:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${userName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Event Name:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Event Type:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${eventType}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 12px 10px; color: #2c3e50; font-size: 20px; font-weight: bold;">$${amount.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Payment Method:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${paymentMethodDisplay}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Date & Time:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${formattedDate}</td>
              </tr>
              ${transactionId ? `
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-family: monospace; font-size: 12px;">${transactionId}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Registration ID:</td>
                <td style="padding: 12px 10px; color: #2c3e50; font-family: monospace; font-size: 12px;">${registrationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>📋 Important:</strong> Please keep this receipt for your records. You can view your payment history in your dashboard.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Dashboard
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
            This is an automated receipt from GUC Al-Ahly Club.<br>
            If you have any questions, please contact our support team.<br>
            <br>
            © ${new Date().getFullYear()} GUC Al-Ahly Club. All rights reserved.
          </p>
        </div>
      </div>
    `
  };

  try {
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Payment receipt sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending payment receipt:', error);
    // Don't throw error - payment was successful, just log email failure
    return false;
  }
};
