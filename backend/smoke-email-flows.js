import dotenv from 'dotenv';
dotenv.config();

import { sendVendorAcceptanceEmail, sendVendorPaymentReceipt, sendVendorQRCodes, sendVendorRejectionEmail } from './services/emailService.js';

(async () => {
  try {
    const recipient = process.env.EMAIL_USER;
    console.log('=== VENDOR EMAIL FLOWS SMOKE TEST ===\n');
    console.log('Test recipient:', recipient);
    console.log('Testing all 4 vendor email flows:\n');

    // ========== FLOW 1: VENDOR APPLIES → GETS ACCEPTED ==========
    console.log('📧 FLOW 1: Application Acceptance Email');
    console.log('Simulating: Vendor applies to bazaar → Admin accepts\n');
    
    await sendVendorAcceptanceEmail(recipient, {
      userName: 'Abdullah Salem',
      applicationType: 'Bazaar',
      eventName: 'Al-Ahly Spring Bazaar 2025',
      location: 'Sports Complex - Zone A',
      boothSize: '4x4',
      duration: null,
      participationFee: 250.00,
      paymentDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      applicationId: 'APP-001-BAZAAR'
    });
    console.log('✅ Acceptance email sent\n');

    // ========== FLOW 2: VENDOR PAYS → GETS RECEIPT ==========
    console.log('💳 FLOW 2: Payment Receipt Email');
    console.log('Simulating: Vendor pays participation fee via wallet\n');
    
    await sendVendorPaymentReceipt(recipient, {
      userName: 'Abdullah Salem',
      applicationType: 'Bazaar',
      eventName: 'Al-Ahly Spring Bazaar 2025',
      location: 'Sports Complex - Zone A',
      boothSize: '4x4',
      duration: null,
      amount: 250.00,
      paymentMethod: 'wallet',
      transactionId: 'TXN-20251125-001',
      paymentDate: new Date().toISOString(),
      applicationId: 'APP-001-BAZAAR'
    });
    console.log('✅ Payment receipt email sent\n');

    // ========== FLOW 3: VENDOR REQUESTS QR CODES ==========
    console.log('📱 FLOW 3: QR Codes Email');
    console.log('Simulating: Vendor requests QR codes for 5 registered visitors\n');
    
    await sendVendorQRCodes(recipient, {
      userName: 'Abdullah Salem',
      applicationType: 'Bazaar',
      eventName: 'Al-Ahly Spring Bazaar 2025',
      location: 'Sports Complex - Zone A',
      visitors: [
        { name: 'Ahmed Hassan', email: 'ahmed@example.com', registration_id: 'REG-001', vendor_application_id: 'APP-001-BAZAAR' },
        { name: 'Fatima Amin', email: 'fatima@example.com', registration_id: 'REG-002', vendor_application_id: 'APP-001-BAZAAR' },
        { name: 'Karim Nasser', email: 'karim@example.com', registration_id: 'REG-003', vendor_application_id: 'APP-001-BAZAAR' },
        { name: 'Sarah Ibrahim', email: 'sarah@example.com', registration_id: 'REG-004', vendor_application_id: 'APP-001-BAZAAR' },
        { name: 'Mohamed Ali', email: 'mohamed@example.com', registration_id: 'REG-005', vendor_application_id: 'APP-001-BAZAAR' }
      ]
    });
    console.log('✅ QR codes email sent (with 5 QR code attachments)\n');

    // ========== FLOW 4: VENDOR APPLIES → GETS REJECTED ==========
    console.log('❌ FLOW 4: Application Rejection Email');
    console.log('Simulating: Vendor applies to booth event → Admin rejects\n');
    
    await sendVendorRejectionEmail(recipient, {
      userName: 'Abdullah Salem',
      applicationType: 'Booth Event',
      rejectionReason: 'Documentation incomplete. Please provide valid business license and tax certificate. Resubmit once all documents are ready.'
    });
    console.log('✅ Rejection email sent\n');

    // ========== TEST COMPLETE ==========
    console.log('═══════════════════════════════════════');
    console.log('✅ ALL VENDOR EMAIL FLOWS TESTED');
    console.log('═══════════════════════════════════════\n');
    console.log('Summary:');
    console.log('  1. ✅ Acceptance email (bazaar application accepted)');
    console.log('  2. ✅ Payment receipt email (wallet payment)');
    console.log('  3. ✅ QR codes email (5 visitors with QR attachments)');
    console.log('  4. ✅ Rejection email (booth application rejected)\n');
    console.log('Check your inbox at:', recipient);
    console.log('You should receive 4 emails demonstrating all vendor workflows.\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Smoke test failed:', err);
    process.exit(1);
  }
})();
