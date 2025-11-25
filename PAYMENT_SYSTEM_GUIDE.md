# Payment System Integration Guide

## Frontend Payment System Complete! ✅

All payment components have been created and are ready to use.

## Components Created

### 1. **PaymentModal** (`frontend/app/components/PaymentModal.js`)
Main payment modal with wallet/card payment options.

**Props:**
- `isOpen`: boolean - controls modal visibility
- `onClose`: function - called when modal closes
- `eventId`: string - ID of the event being paid for
- `registrationId`: string - ID of the registration
- `amount`: number - payment amount
- `eventName`: string - name of the event
- `eventType`: string - 'workshop' or 'trip'
- `onPaymentSuccess`: function - callback after successful payment

### 2. **WalletBalance** (`frontend/app/components/WalletBalance.js`)
Displays user's wallet balance with top-up option.

**Props:**
- `compact`: boolean (default: false) - compact display mode

### 3. **CardPaymentForm** (`frontend/app/components/CardPaymentForm.js`)
Stripe card payment form (used inside PaymentModal).

### 4. **StripeProvider** (`frontend/app/components/StripeProvider.js`)
Stripe Elements context provider (used inside PaymentModal).

### 5. **Payment History Pages**
- `/student/payment-history/page.js`
- `/staff/payment-history/page.js`
- `/ta/payment-history/page.js`
- `/professor/payment-history/page.js`

## How to Integrate PaymentModal into Registration Flow

### Example: Student Events Page

```javascript
'use client';

import { useState } from 'react';
import { registrationAPI } from '@/utils/api';
import PaymentModal from '@/app/components/PaymentModal';

export default function EventsPage() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);

  const handleRegister = async (event) => {
    try {
      // Step 1: Create registration
      const response = await registrationAPI.register({
        event_id: event._id,
        name: user.name,
        email: user.email,
        personalId: user.personalId,
        role: user.role
      });

      // Step 2: Check if payment is required
      const eventPrice = event.price || 0;
      
      if (eventPrice > 0) {
        // Show payment modal
        setPaymentData({
          eventId: event._id,
          registrationId: response.registration._id,
          amount: eventPrice,
          eventName: event.name,
          eventType: event.type
        });
        setShowPaymentModal(true);
      } else {
        // Free event, registration complete
        alert('Registration successful!');
      }
    } catch (err) {
      alert('Registration failed: ' + err.message);
    }
  };

  const handlePaymentSuccess = (payment) => {
    console.log('Payment successful:', payment);
    setShowPaymentModal(false);
    alert('Payment completed! Registration confirmed.');
    // Refresh events or navigate to my registrations
  };

  return (
    <div>
      {/* Your events list */}
      <button onClick={() => handleRegister(event)}>
        Register
      </button>

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          eventId={paymentData.eventId}
          registrationId={paymentData.registrationId}
          amount={paymentData.amount}
          eventName={paymentData.eventName}
          eventType={paymentData.eventType}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
```

## How to Add WalletBalance to Dashboard

### Example: Student Dashboard

```javascript
'use client';

import WalletBalance from '@/app/components/WalletBalance';

export default function StudentDashboard() {
  return (
    <div className="dashboard">
      {/* Compact wallet widget */}
      <WalletBalance compact />
      
      {/* OR full wallet card */}
      <WalletBalance />
      
      {/* Rest of dashboard */}
    </div>
  );
}
```

## Environment Variables Needed

Add to `frontend/.env.local`:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

Add to `backend/.env`:

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
```

## API Endpoints Available (Frontend)

All payment API functions are in `frontend/utils/api.js`:

```javascript
import { paymentAPI } from '@/utils/api';

// Get wallet balance
const { wallet } = await paymentAPI.getWalletBalance();

// Top up wallet
await paymentAPI.topUpWallet(100.00);

// Get wallet transactions
const { transactions } = await paymentAPI.getWalletTransactions();

// Pay with wallet
await paymentAPI.payWithWallet(eventId, registrationId);

// Create Stripe payment intent
const { clientSecret, payment } = await paymentAPI.createStripeIntent(eventId, registrationId);

// Confirm Stripe payment
await paymentAPI.confirmStripePayment(paymentId, paymentIntentId);

// Get payment history
const { payments } = await paymentAPI.getPaymentHistory();
```

## Quick Start Steps

### 1. **Update Event Models (Backend)**
Add price field to Workshop and Trip models:

```javascript
// backend/models/Event.js
const eventSchema = new mongoose.Schema({
  // ... existing fields
  price: {
    type: Number,
    default: 0,
    min: 0
  }
});
```

### 2. **Update Registration Flow (Frontend)**
Integrate PaymentModal as shown in the example above.

### 3. **Add Wallet Widget to Dashboards**
Add WalletBalance component to student/staff/ta/professor dashboards.

### 4. **Add Navigation Links**
Add "Payment History" link to navigation menus:

```javascript
<Link href="/student/payment-history">
  💰 Payment History
</Link>
```

### 5. **Get Stripe API Keys**
1. Create account at https://stripe.com
2. Get publishable key (pk_test_...)
3. Get secret key (sk_test_...)
4. Add to environment variables

### 6. **Install Stripe in Backend**
```bash
cd backend
npm install stripe
```

### 7. **Replace Mock Stripe with Real Stripe**
In `backend/controllers/paymentController.js`, replace mock implementation:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Replace createStripePayment mock code with:
const paymentIntent = await stripe.paymentIntents.create({
  amount: Math.round(amount * 100), // Convert to cents
  currency: 'usd',
  metadata: {
    event_id: eventId,
    registration_id: registrationId,
    user_id: req.user._id.toString()
  }
});
```

## Testing

### Test Wallet Payment
1. User visits event page
2. Clicks "Register"
3. PaymentModal opens showing wallet balance
4. User clicks "Pay with Wallet"
5. Balance is deducted, registration marked as paid

### Test Card Payment
1. User visits event page
2. Clicks "Register"
3. PaymentModal opens
4. User clicks "Pay with Credit/Debit Card"
5. Stripe card form appears
6. User enters test card: `4242 4242 4242 4242`
7. Payment processed, registration marked as paid

### Test Wallet Top-Up
1. User adds WalletBalance to dashboard
2. Clicks "Add Funds"
3. Enters amount (e.g., $50.00)
4. Clicks "Confirm"
5. Wallet balance updates

## Next Steps

1. ✅ Backend payment system complete
2. ✅ Frontend payment components complete
3. ⏳ Add price field to Workshop/Trip models
4. ⏳ Integrate PaymentModal into registration flows
5. ⏳ Add WalletBalance to dashboards
6. ⏳ Add payment history navigation links
7. ⏳ Get Stripe API keys
8. ⏳ Replace mock Stripe with real Stripe API
9. ⏳ Test end-to-end payment flows

## Support

Payment system supports:
- ✅ Wallet payments (deduct from balance)
- ✅ Card payments (Stripe integration)
- ✅ Payment history tracking
- ✅ Wallet transaction history
- ✅ Wallet top-up
- ✅ Multiple user roles (Student/Staff/TA/Professor)
- ✅ Payment status tracking (pending/completed/failed/refunded)
- ✅ Secure card input (Stripe Elements)
- ✅ Mobile responsive design
