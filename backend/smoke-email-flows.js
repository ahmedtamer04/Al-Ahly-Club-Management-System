import dotenv from 'dotenv';
dotenv.config();

import { generateVerificationToken, sendVerificationEmail, sendVendorAcceptanceEmail, sendVendorQRCodes, sendNewLoyaltyPartnerNotification, sendVendorRejectionEmail } from './services/emailService.js';

(async () => {
  try {
    const recipient = process.env.EMAIL_USER;
    console.log('Running smoke email flows, recipient:', recipient);

    // 1) Verification email
    const token = generateVerificationToken();
    console.log('\nSending verification email...');
    await sendVerificationEmail(recipient, token, 'Vendor', 'Abdullah', false);

    // 2) Vendor acceptance email
    console.log('\nSending vendor acceptance email...');
    await sendVendorAcceptanceEmail(recipient, {
      userName: 'Abdullah',
      applicationType: 'Booth Event',
      eventName: 'Al-Ahly Test Event',
      location: 'Main Hall',
      boothSize: '3x3',
      duration: '2 days',
      participationFee: 150.00,
      paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      applicationId: 'SMOKE-APP-001'
    });

    // 3) Send QR codes
    console.log('\nSending QR codes email...');
    await sendVendorQRCodes(recipient, {
      userName: 'Abdullah',
      applicationType: 'Booth Event',
      eventName: 'Al-Ahly Test Event',
      location: 'Main Hall',
      visitors: [
        { name: 'Visitor One', email: 'visitor1@example.com', registration_id: 'REG-001', vendor_application_id: 'SMOKE-APP-001' },
        { name: 'Visitor Two', email: 'visitor2@example.com', registration_id: 'REG-002', vendor_application_id: 'SMOKE-APP-001' }
      ]
    });

    // 4) New loyalty partner notification
    console.log('\nSending loyalty partner notification...');
    await sendNewLoyaltyPartnerNotification(recipient, {
      userName: 'Abdullah',
      vendorName: 'Test Vendor',
      companyName: 'Test Co',
      discountRate: 15,
      promoCode: 'TEST15',
      termsAndConditions: 'Use this code to get 15% off. Valid for one use per user.'
    });

    // 5) Vendor rejection email
    console.log('\nSending vendor rejection email...');
    await sendVendorRejectionEmail(recipient, {
      userName: 'Abdullah',
      applicationType: 'Booth Event',
      rejectionReason: 'Insufficient documentation provided.'
    });

    console.log('\nSmoke email flows completed. Check your inbox for multiple messages.');
    process.exit(0);
  } catch (err) {
    console.error('Smoke test failed:', err);
    process.exit(1);
  }
})();
