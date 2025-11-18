# 📧 Email Configuration - Quick Reference

## ⚠️ Important Notice

**Email configuration is already set up in the codebase.** You just need to add your own Gmail credentials to your `.env` file.

**This is sensitive information** - each developer should use their own Gmail account and App Password. Never commit your `.env` file to git.

---

## 🚀 Quick Setup (3 Steps)

### 1. Get Gmail App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Enable 2-Factor Authentication if not already enabled
3. Create App Password for "Mail"
4. Copy the 16-character password (remove spaces)

### 2. Add to .env File

In `backend/.env`, add:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
```

### 3. Test Configuration

```bash
cd backend
node test-email-config.js
```

If successful, you'll receive a test email! ✅

---

## 📚 Full Documentation

For detailed instructions, troubleshooting, and examples, see:
- **[EMAIL_SETUP_GUIDE.md](../EMAIL_SETUP_GUIDE.md)** (in project root)

---

## 💡 For Developers Adding Email Features

The email service is already configured. You can use these functions from `services/emailService.js`:

- `sendVerificationEmail()` - Email verification
- `sendPaymentReceipt()` - Payment receipts
- `sendCertificateEmail()` - Certificate delivery
- `sendVendorAcceptanceEmail()` - Vendor notifications
- `sendVendorQRCodes()` - QR code delivery
- `sendGymSessionCancellationEmail()` - Gym updates
- And more...

**Example usage:**
```javascript
import { sendVerificationEmail } from '../services/emailService.js';

await sendVerificationEmail(
  user.email,
  token,
  user.role,
  `${user.first_name} ${user.last_name}`,
  true // isStudent
);
```

---

## ✅ Checklist

Before implementing email features:

- [ ] Gmail App Password generated
- [ ] `.env` file has `EMAIL_USER` and `EMAIL_PASS`
- [ ] Test script runs successfully
- [ ] Test email received in inbox

---

**Need help?** Check `EMAIL_SETUP_GUIDE.md` or run `node test-email-config.js` for detailed error messages.

