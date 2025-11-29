import nodemailer from 'nodemailer';
import crypto from 'crypto';
import QRCode from 'qrcode';

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

export const sendCertificateEmail = async (email, certificateData, pdfBuffer) => {
  const {
    userName,
    workshopName,
    workshopDate,
    certificateId
  } = certificateData;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Certificate of Attendance - ${workshopName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">🎓 Congratulations!</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">Certificate of Attendance</h2>
            <p style="color: #1b5e20; margin: 0; font-size: 14px;">You have successfully completed the workshop!</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">Workshop Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; width: 40%;">Participant:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${userName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Workshop:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${workshopName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Date:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${workshopDate}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Certificate ID:</td>
                <td style="padding: 12px 10px; color: #2c3e50; font-family: monospace; font-size: 12px;">${certificateId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>📎 Note:</strong> Your certificate is attached to this email as a PDF file. Please download and save it for your records.
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
            This certificate has been automatically generated and sent to you upon completing the workshop.<br>
            For any questions, please contact our support team.<br>
            <br>
            © ${new Date().getFullYear()} GUC Al-Ahly Club. All rights reserved.
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${workshopName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Certificate email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending certificate email:', error);
    throw new Error('Failed to send certificate email');
  }
};

// Send vendor payment receipt
export const sendVendorPaymentReceipt = async (email, paymentDetails) => {
  const {
    userName,
    applicationType,
    eventName,
    location,
    boothSize,
    duration,
    amount,
    paymentMethod,
    transactionId,
    paymentDate,
    applicationId
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
    subject: `Payment Receipt - ${applicationType} Participation Fee`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">✅ Payment Successful</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club - Vendor Participation</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">Payment Receipt</h2>
            <p style="color: #1b5e20; margin: 0; font-size: 14px;">Your participation fee has been processed successfully.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">Payment Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; width: 40%;">Vendor:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${userName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Application Type:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${applicationType}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Event Name:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${eventName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Location:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${location}</td>
              </tr>
              ${duration ? `
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Duration:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${duration}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Booth Size:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${boothSize}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Amount Paid:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-size: 20px; font-weight: bold;">$${amount.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Payment Method:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${paymentMethodDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Date & Time:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${formattedDate}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 12px 10px; color: #2c3e50; font-family: monospace; font-size: 12px;">${transactionId}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Application ID:</td>
                <td style="padding: 12px 0; color: #2c3e50; font-family: monospace; font-size: 12px;">${applicationId}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>📋 Important:</strong> Please keep this receipt for your records. You will receive QR codes for registered visitors via email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/applications" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Applications
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
    console.log(`✅ Vendor payment receipt sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending vendor payment receipt:', error);
    return false;
  }
};

// Send vendor acceptance email with payment information
export const sendVendorAcceptanceEmail = async (email, acceptanceDetails) => {
  const {
    userName,
    applicationType,
    eventName,
    location,
    boothSize,
    duration,
    participationFee,
    paymentDeadline,
    applicationId
  } = acceptanceDetails;

  const formattedDeadline = new Date(paymentDeadline).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Application Accepted - ${applicationType} Participation`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">🎉 Application Accepted!</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #2e7d32; margin: 0 0 10px 0; font-size: 18px;">Congratulations!</h2>
            <p style="color: #1b5e20; margin: 0; font-size: 14px;">Your ${applicationType} application has been accepted.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">Application Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; width: 40%;">Vendor:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${userName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Application Type:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${applicationType}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Event Name:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${eventName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Location:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${location}</td>
              </tr>
              ${duration ? `
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Duration:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${duration}</td>
              </tr>
              ` : ''}
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Booth Size:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${boothSize}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">💰 Payment Required</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #856404; font-weight: 600;">Participation Fee:</td>
                <td style="padding: 12px 0; color: #856404; font-size: 24px; font-weight: bold;">$${participationFee.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #856404; font-weight: 600;">Payment Deadline:</td>
                <td style="padding: 12px 0; color: #856404; font-weight: 600;">${formattedDeadline}</td>
              </tr>
            </table>
            <p style="color: #856404; margin: 15px 0 0 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> Please complete payment within 3 days to secure your participation. 
              You can pay via wallet or credit/debit card in your vendor dashboard.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/applications" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin: 5px;">
              View Application & Pay
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from GUC Al-Ahly Club.<br>
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
    console.log(`✅ Vendor acceptance email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending vendor acceptance email:', error);
    return false;
  }
};

// Send QR codes for registered visitors to vendor
export const sendGymSessionCancellationEmail = async (email, sessionDetails) => {
  try {
    const { userName, sessionType, sessionDate, sessionTime, sessionDuration } = sessionDetails;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #c41e3a 0%, #8b1538 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Gym Session Cancelled</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>We regret to inform you that the gym session you registered for has been <strong>cancelled</strong>.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #dc3545;">Cancelled Session Details:</h3>
              <p><strong>Type:</strong> ${sessionType}</p>
              <p><strong>Date:</strong> ${new Date(sessionDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> ${sessionTime}</p>
              <p><strong>Duration:</strong> ${sessionDuration} minutes</p>
            </div>

            <p>We apologize for any inconvenience this may cause. Please check the gym schedule for alternative sessions.</p>
            
            <p>If you have any questions, please contact the Events Office.</p>
            
            <p>Best regards,<br>GUC Al-Ahly Events Office</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail({
      from: `"GUC Al-Ahly" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Gym Session Cancelled - GUC Al-Ahly',
      html: htmlContent
    });

    console.log(`✅ Gym session cancellation email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending gym session cancellation email to ${email}:`, error);
    return false;
  }
};

export const sendGymSessionEditEmail = async (email, sessionDetails) => {
  try {
    const { userName, sessionType, oldDate, oldTime, newDate, newTime, sessionDuration } = sessionDetails;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff; }
          .change-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ffc107; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✏️ Gym Session Updated</h1>
          </div>
          <div class="content">
            <p>Dear ${userName},</p>
            <p>The gym session you registered for has been <strong>updated</strong>. Please review the changes below.</p>
            
            <div class="info-box">
              <h3 style="margin-top: 0; color: #007bff;">Session Details:</h3>
              <p><strong>Type:</strong> ${sessionType}</p>
              <p><strong>Duration:</strong> ${sessionDuration} minutes</p>
            </div>

            <div class="change-box">
              <h4 style="margin-top: 0; color: #856404;">⚠️ Changes Made:</h4>
              <p><strong>Previous Date & Time:</strong><br>
              ${new Date(oldDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${oldTime}</p>
              <p><strong>New Date & Time:</strong><br>
              ${new Date(newDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${newTime}</p>
            </div>

            <p>Please make note of the new date and time. We apologize for any inconvenience.</p>
            
            <p>If you have any questions or need to cancel your registration, please contact the Events Office.</p>
            
            <p>Best regards,<br>GUC Al-Ahly Events Office</p>
          </div>
          <div class="footer">
            <p>This is an automated notification. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail({
      from: `"GUC Al-Ahly" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Gym Session Updated - GUC Al-Ahly',
      html: htmlContent
    });

    console.log(`✅ Gym session edit email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending gym session edit email to ${email}:`, error);
    return false;
  }
};

export const sendVendorQRCodes = async (email, qrCodeData) => {
  const {
    userName,
    applicationType,
    eventName,
    location,
    visitors
  } = qrCodeData;

  if (!visitors || visitors.length === 0) {
    console.log('No visitors to send QR codes for');
    return false;
  }

  // Generate QR codes for each visitor
  const qrCodeAttachments = [];
  for (const visitor of visitors) {
    try {
      // Create QR code data (registration ID + visitor info)
      const qrData = JSON.stringify({
        registration_id: visitor.registration_id,
        visitor_name: visitor.name,
        visitor_email: visitor.email,
        event_name: eventName,
        vendor_application_id: visitor.vendor_application_id
      });

      // Generate QR code as buffer
      const qrCodeBuffer = await QRCode.toBuffer(qrData, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 300,
        margin: 2
      });

      qrCodeAttachments.push({
        filename: `QR_${visitor.name.replace(/[^a-zA-Z0-9]/g, '_')}_${visitor.registration_id}.png`,
        content: qrCodeBuffer,
        contentType: 'image/png'
      });
    } catch (error) {
      console.error(`Error generating QR code for ${visitor.name}:`, error);
    }
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `QR Codes for Registered Visitors - ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2c3e50; margin: 0;">📱 Visitor QR Codes</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1976d2; margin: 0 0 10px 0; font-size: 18px;">QR Codes Ready</h2>
            <p style="color: #1565c0; margin: 0; font-size: 14px;">You have ${visitors.length} registered visitor(s) for your ${applicationType}.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; margin-bottom: 20px;">Event Information</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; width: 40%;">Vendor:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${userName}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Event:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Location:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${location}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Total Visitors:</td>
                <td style="padding: 12px 10px; color: #2c3e50; font-weight: bold;">${visitors.length}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-size: 16px;">📋 Registered Visitors</h3>
            <ul style="color: #856404; margin: 0; padding-left: 20px;">
              ${visitors.map(v => `<li style="margin-bottom: 8px;"><strong>${v.name}</strong> (${v.email})</li>`).join('')}
            </ul>
          </div>

          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2e7d32; margin: 0 0 15px 0; font-size: 16px;">📎 QR Code Files</h3>
            <p style="color: #1b5e20; margin: 0; font-size: 14px;">
              QR code images for all registered visitors are attached to this email. 
              Each QR code contains the visitor's registration information and can be used for event entry verification.
            </p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>📋 Instructions:</strong> 
              <ul style="margin: 10px 0 0 20px; padding: 0;">
                <li>Download all QR code images from the attachments</li>
                <li>Share the appropriate QR code with each visitor</li>
                <li>Visitors should present their QR code at the event entrance</li>
                <li>Each QR code is unique and tied to a specific visitor</li>
              </ul>
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vendor/applications" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Applications
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from GUC Al-Ahly Club.<br>
            If you have any questions, please contact our support team.<br>
            <br>
            © ${new Date().getFullYear()} GUC Al-Ahly Club. All rights reserved.
          </p>
        </div>
      </div>
    `,
    attachments: qrCodeAttachments
  };

  try {
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ QR codes sent to ${email} for ${visitors.length} visitor(s)`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending QR codes:', error);
    return false;
  }
};

// Send notification email to all Students/Staff/TA/Professor about new loyalty program partner
export const sendNewLoyaltyPartnerNotification = async (email, partnerDetails) => {
  const {
    userName,
    vendorName,
    companyName,
    discountRate,
    promoCode,
    termsAndConditions
  } = partnerDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🎁 New Partner Added to GUC Loyalty Program - ${vendorName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Loyalty Program Partner</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎁 New Loyalty Partner!</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Dear ${userName},
            </p>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Great news! A new vendor has joined the <strong>GUC Loyalty Program</strong> and is now offering exclusive discounts to GUC community members!
            </p>
            
            <!-- Vendor Info Card -->
            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #333; margin: 0 0 10px 0; font-size: 22px;">
                ${vendorName}${companyName ? ` - ${companyName}` : ''}
              </h2>
              
              <!-- Discount Badge -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
                <div style="font-size: 14px; margin-bottom: 5px;">Special Discount</div>
                <div style="font-size: 32px; font-weight: bold;">${discountRate}% OFF</div>
              </div>
              
              <!-- Promo Code -->
              <div style="background-color: #e3f2fd; border: 2px dashed #1976d2; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0;">
                <div style="font-size: 12px; color: #666; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">Promo Code</div>
                <div style="font-size: 24px; font-family: monospace; font-weight: bold; color: #1976d2; letter-spacing: 3px;">
                  ${promoCode}
                </div>
              </div>
              
              <!-- Terms & Conditions -->
              <div style="margin-top: 15px;">
                <h3 style="color: #333; font-size: 16px; margin: 0 0 10px 0;">Terms & Conditions:</h3>
                <div style="background-color: white; padding: 15px; border-radius: 6px; color: #555; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${termsAndConditions}
                </div>
              </div>
            </div>
            
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              Don't miss out on this exclusive offer! Use the promo code <strong>${promoCode}</strong> to enjoy ${discountRate}% off at ${vendorName}.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/loyalty-program" 
                 style="background-color: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;">
                View All Loyalty Partners
              </a>
            </div>
            
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>💡 Tip:</strong> Visit the Loyalty Program page to see all available partners and their exclusive discounts!
              </p>
            </div>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0; padding: 0 30px 30px 30px;">
            This is an automated email from GUC Al-Ahly Club.<br>
            You are receiving this because you are a member of the GUC community.<br>
            <br>
            © ${new Date().getFullYear()} GUC Al-Ahly Club. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `
  };

  try {
    const emailTransporter = getTransporter();
    const info = await emailTransporter.sendMail(mailOptions);
    console.log(`✅ New loyalty partner notification sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending new loyalty partner notification to ${email}:`, error);
    return false;
  }
};

/**
 * Send vendor rejection email
 */
export const sendVendorRejectionEmail = async (email, rejectionDetails) => {
  const {
    userName,
    applicationType,
    rejectionReason
  } = rejectionDetails;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Application Status - ${applicationType}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #c41e3a; margin: 0;">Application Status Update</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
            <p style="color: #856404; margin: 0; font-size: 16px;">
              Thank you for your interest in participating with us. Unfortunately, we are unable to move forward with your ${applicationType} application at this time.
            </p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #c41e3a; padding-bottom: 10px; margin-bottom: 20px;">Reason for Decision</h3>
            <p style="color: #555; line-height: 1.8; margin: 0;">${rejectionReason}</p>
          </div>

          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 10px;">What You Can Do</h3>
            <ul style="color: #2e7d32; margin: 0; padding-left: 20px;">
              <li>Address the concerns mentioned above and reapply in future events</li>
              <li>Contact our support team if you need clarification</li>
              <li>Check for upcoming events and applications in our portal</li>
            </ul>
          </div>
          
          <p style="color: #666; margin: 20px 0;">We appreciate your understanding and hope to work with you in the future.</p>
          
          <p style="color: #2c3e50; margin: 0;">Best regards,<br><strong>GUC Al-Ahly Club Team</strong></p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
            This is an automated email from GUC Al-Ahly Club.<br>
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
    console.log(`✅ Vendor rejection email sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending vendor rejection email to ${email}:`, error);
    return false;
  }
};

// Send comment deletion warning email
export const sendCommentDeletionWarning = async (email, warningDetails) => {
  const {
    userName,
    eventName,
    commentBody,
    deletedBy,
    deletionDate,
    reason
  } = warningDetails;

  const formattedDate = new Date(deletionDate).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '⚠️ Warning: Your Comment Has Been Removed',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #d32f2f; margin: 0;">⚠️ Comment Removal Notice</h1>
            <p style="color: #7f8c8d; margin-top: 10px;">GUC Al-Ahly Club</p>
          </div>
          
          <div style="background-color: #ffebee; padding: 20px; border-left: 4px solid #d32f2f; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #c62828; margin: 0 0 10px 0; font-size: 18px;">Warning: Inappropriate Content</h2>
            <p style="color: #b71c1c; margin: 0; font-size: 14px;">Your comment has been removed by our moderation team.</p>
          </div>
          
          <div style="margin-bottom: 30px;">
            <p style="color: #2c3e50; line-height: 1.6;">Dear ${userName},</p>
            <p style="color: #2c3e50; line-height: 1.6;">
              We are writing to inform you that one of your comments on an event has been removed for violating our community guidelines.
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; border-bottom: 2px solid #d32f2f; padding-bottom: 10px; margin-bottom: 20px;">Removal Details</h3>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600; width: 30%;">Event:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${eventName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600;">Removed By:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${deletedBy}</td>
              </tr>
              <tr style="background-color: #f8f9fa;">
                <td style="padding: 12px 10px; color: #7f8c8d; font-weight: 600;">Removal Date:</td>
                <td style="padding: 12px 10px; color: #2c3e50;">${formattedDate}</td>
              </tr>
              ${reason ? `
              <tr>
                <td style="padding: 12px 0; color: #7f8c8d; font-weight: 600; vertical-align: top;">Reason:</td>
                <td style="padding: 12px 0; color: #2c3e50;">${reason}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 16px;">Your Removed Comment:</h4>
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-top: 10px;">
              <p style="color: #5d4037; margin: 0; font-style: italic; line-height: 1.6;">
                "${commentBody.length > 200 ? commentBody.substring(0, 200) + '...' : commentBody}"
              </p>
            </div>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h4 style="color: #1565c0; margin: 0 0 15px 0; font-size: 16px;">📌 Community Guidelines Reminder:</h4>
            <ul style="color: #0d47a1; margin: 0; padding-left: 20px; line-height: 1.8;">
              <li>Be respectful and courteous to all members</li>
              <li>Avoid offensive, discriminatory, or inappropriate language</li>
              <li>Keep comments relevant and constructive</li>
              <li>Do not spam or post misleading information</li>
              <li>Respect privacy and confidentiality</li>
            </ul>
          </div>

          <div style="background-color: #ffcdd2; padding: 15px; border-radius: 8px; margin-bottom: 30px;">
            <p style="color: #c62828; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> Repeated violations of our community guidelines may result in account suspension or termination. Please ensure all future comments comply with our standards.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Return to Dashboard
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          
          <p style="color: #95a5a6; font-size: 12px; text-align: center; margin: 0;">
            This is an automated notification from GUC Al-Ahly Club.<br>
            If you believe this removal was made in error, please contact our support team.<br>
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
    console.log(`✅ Comment deletion warning sent to ${email}`);
    console.log(`Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending comment deletion warning:', error);
    // Don't throw error - deletion was successful, just log email failure
    return false;
  }
};
