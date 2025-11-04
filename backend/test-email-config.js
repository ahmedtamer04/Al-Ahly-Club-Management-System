import dotenv from "dotenv";
dotenv.config();

import nodemailer from 'nodemailer';

console.log("=== EMAIL CONFIGURATION TEST ===\n");

// Check if credentials are set
console.log("EMAIL_USER:", process.env.EMAIL_USER || "❌ NOT SET");
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "✅ SET (hidden)" : "❌ NOT SET");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "http://localhost:3000");
console.log("DEVELOPMENT_MODE:", process.env.DEVELOPMENT_MODE || "not set");

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log("\n❌ ERROR: Email credentials missing in .env file");
  console.log("\nPlease set:");
  console.log("EMAIL_USER=your-email@gmail.com");
  console.log("EMAIL_PASS=your-16-char-app-password");
  process.exit(1);
}

console.log("\n🔍 Testing email connection...\n");

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test connection
transporter.verify()
  .then(() => {
    console.log("✅ Email connection successful!");
    console.log("\n📧 Sending test email...\n");
    
    // Send test email
    return transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Send to yourself
      subject: 'Al-Ahly Email Service Test - ' + new Date().toLocaleString(),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">✅ Email Service Working!</h2>
          <p>This is a test email from the Al-Ahly Club Management System.</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <p>If you received this email, your email configuration is working correctly! 🎉</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ecf0f1;">
          <p style="color: #95a5a6; font-size: 12px;">
            This is a test email. You can safely delete it.<br>
            Al-Ahly Club Management System
          </p>
        </div>
      `
    });
  })
  .then((info) => {
    console.log("✅ Test email sent successfully!");
    console.log("Message ID:", info.messageId);
    console.log("Check your inbox:", process.env.EMAIL_USER);
    console.log("\n🎉 Email configuration is working correctly!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ EMAIL SERVICE ERROR:", error.message);
    console.error("\nError Code:", error.code);
    
    if (error.code === 'EAUTH') {
      console.log("\n🔧 AUTHENTICATION FAILED");
      console.log("\nThis means your EMAIL_PASS is incorrect or not an App Password.");
      console.log("\nHow to fix:");
      console.log("1. Go to: https://myaccount.google.com/security");
      console.log("2. Enable 2-Factor Authentication (if not enabled)");
      console.log("3. Search for 'App passwords' and create one for 'Mail'");
      console.log("4. Copy the 16-character password (remove spaces)");
      console.log("5. Update EMAIL_PASS in your .env file");
      console.log("6. Restart this test");
    } else if (error.code === 'ECONNECTION') {
      console.log("\n🔧 CONNECTION FAILED");
      console.log("Check your internet connection or firewall settings.");
    } else {
      console.log("\nFull error details:", error);
    }
    
    process.exit(1);
  });
