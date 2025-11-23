# 📧 Email Configuration Guide

## ⚠️ Important Notice from Scrum Master

> **"Email configuration is done so anyone who will implement any requirement with email can add the extra thing but copilot will help u, in .env file you write your email and email app password you get it from gmail search for that so the app can send emails form your account it's a sensitive info that's why i didn't include mine, please work on your branch"**

**Translation:** 
- ✅ Email service is already configured in the codebase
- ✅ You just need to add your own Gmail credentials to `.env`
- ✅ Each developer uses their own Gmail account (sensitive info)
- ✅ Work on your own branch when implementing email features

---

## Overview

The Al-Ahly Club Management System uses **Gmail** to send emails for:
- ✅ Email verification (for new user registrations)
- ✅ Payment receipts
- ✅ Certificate delivery
- ✅ Vendor notifications
- ✅ Gym session updates
- ✅ And more...

**Important:** Each developer needs to configure their own Gmail credentials in their `.env` file. This is sensitive information and should **never** be committed to git.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click **2-Step Verification**
3. Follow the prompts to enable 2FA (if not already enabled)

### Step 2: Generate Gmail App Password

1. Still on the Security page, search for **"App passwords"** or go directly to:
   [App Passwords](https://myaccount.google.com/apppasswords)

2. You may need to sign in again

3. Under "Select app", choose **"Mail"**

4. Under "Select device", choose **"Other (Custom name)"** and type: `Al-Ahly Backend`

5. Click **"Generate"**

6. **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)
   - Remove all spaces when using it
   - Example: `abcdefghijklmnop`

### Step 3: Configure Your .env File

1. In the `backend` folder, create a `.env` file (if it doesn't exist)

2. Copy from `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Add your email credentials:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=abcdefghijklmnop
   ```
   ⚠️ **Important:** Remove spaces from the app password!

4. Save the file

### Step 4: Test Your Email Configuration

Run the test script:
```bash
cd backend
node test-email-config.js
```

**Expected Output:**
```
=== EMAIL CONFIGURATION TEST ===

EMAIL_USER: your-email@gmail.com
EMAIL_PASS: ✅ SET (hidden)
FRONTEND_URL: http://localhost:3000

🔍 Testing email connection...

✅ Email connection successful!

📧 Sending test email...

✅ Test email sent successfully!
Message ID: <message-id>
Check your inbox: your-email@gmail.com

🎉 Email configuration is working correctly!
```

**If successful:** Check your inbox for the test email!

---

## 🐛 Troubleshooting

### Error: "EAUTH" - Authentication Failed

**Problem:** Your `EMAIL_PASS` is incorrect or not an App Password.

**Solution:**
1. Make sure you're using an **App Password**, not your regular Gmail password
2. Verify you copied the password correctly (no spaces)
3. Regenerate a new App Password and update `.env`
4. Restart your backend server

### Error: "ECONNECTION" - Connection Failed

**Problem:** Network or firewall issue.

**Solution:**
1. Check your internet connection
2. Check if your firewall is blocking Node.js
3. Try again after a few minutes

### Error: "EMAIL_USER or EMAIL_PASS not set"

**Problem:** Environment variables not loaded.

**Solution:**
1. Make sure `.env` file exists in the `backend` folder
2. Check that variables are spelled correctly: `EMAIL_USER` and `EMAIL_PASS`
3. Restart your backend server after changing `.env`

### Test Email Not Received

**Possible Causes:**
1. Check spam/junk folder
2. Wait a few minutes (Gmail can be slow)
3. Verify the email address is correct
4. Check if Gmail has any security alerts

---

## 📋 Environment Variables Reference

### Required for Email Functionality

```env
EMAIL_USER=your-email@gmail.com        # Your Gmail address
EMAIL_PASS=your-16-char-app-password   # Gmail App Password (no spaces)
```

### Optional (with defaults)

```env
FRONTEND_URL=http://localhost:3000     # Used in email links
DEVELOPMENT_MODE=true                  # Allows non-GUC emails
SKIP_EMAIL_VERIFICATION=true           # Skips email verification in dev
```

---

## 🔒 Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use App Passwords** - Never use your regular Gmail password
3. **Keep App Passwords secret** - Don't share them with others
4. **Rotate passwords** - Regenerate App Passwords periodically
5. **Use different emails** - Consider using a dedicated email for development

---

## 📧 Email Features in the System

Once configured, the system can send:

| Feature | When Sent | Recipient |
|---------|-----------|-----------|
| **Email Verification** | User registration | New users (Students, Staff, TA, Professor) |
| **Payment Receipt** | After successful payment | User who made payment |
| **Certificate** | Workshop completion | Workshop participant |
| **Vendor Acceptance** | Application approved | Vendor |
| **Vendor Payment Receipt** | Vendor payment completed | Vendor |
| **QR Codes** | Vendor requests QR codes | Vendor |
| **Gym Session Updates** | Session cancelled/edited | Registered users |

---

## 🧪 Testing Email Features

### Test Email Verification

1. Set in `.env`:
   ```env
   SKIP_EMAIL_VERIFICATION=false
   ```

2. Register a new user
3. Check email inbox for verification link
4. Click link to verify

### Test Payment Receipt

1. Make a payment (wallet or Stripe)
2. Check email for receipt
3. Verify all payment details are correct

### Test Certificate Email

1. Complete a workshop
2. Certificate should be generated and emailed
3. Check email for PDF attachment

---

## 💡 Tips

- **Development:** Use `SKIP_EMAIL_VERIFICATION=true` to skip email verification during testing
- **Production:** Always set `SKIP_EMAIL_VERIFICATION=false` and use proper email credentials
- **Testing:** Use the `test-email-config.js` script to verify setup before implementing features
- **Multiple Developers:** Each developer should use their own Gmail account and App Password

---

## 📚 Additional Resources

- [Gmail App Passwords Help](https://support.google.com/accounts/answer/185833)
- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail SMTP Settings](https://support.google.com/a/answer/176600)

---

## ✅ Checklist

Before implementing email features, make sure:

- [ ] Gmail 2FA is enabled
- [ ] App Password is generated
- [ ] `.env` file has `EMAIL_USER` and `EMAIL_PASS`
- [ ] Test script runs successfully (`node test-email-config.js`)
- [ ] Test email is received in inbox
- [ ] Backend server can start without email errors

---

**Need Help?** Check the `test-email-config.js` file for detailed error messages and solutions.

