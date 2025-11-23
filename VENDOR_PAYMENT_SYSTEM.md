# Vendor Participation Fee Payment System

## Overview

The Vendor Participation Fee Payment System allows vendors to pay fees for bazaar and booth event participation after their applications are **accepted** by admin staff.

## Key Features

### 1. **Payment Deadline: 3 Days After Acceptance**
- When a vendor application is accepted, a payment deadline is automatically set to **3 days** from the approval date
- Vendors receive an acceptance email with payment instructions
- Payment deadline is displayed in the vendor dashboard

### 2. **Participation Fee Calculation**

#### Bazaar Applications
- **2×2 Booth**: $150
- **4×4 Booth**: $400

#### Booth Event Applications
- **2×2 Booth**: $150
- **4×4 Booth**: $400
- Duration: 1-4 weeks (included in the fee)

### 3. **Payment Methods**

#### A. Wallet Payment
- Vendors can pay using their account wallet balance
- Deducts funds immediately from wallet
- Instant confirmation and payment receipt

#### B. Stripe Payment
- Secure card payment via Stripe
- Payment intent created and sent to vendor
- Vendor confirms payment through Stripe checkout
- Webhook verification required (implemented in backend)

## User Flow for Vendors

### Step 1: View Accepted Applications
1. Go to **Vendor Dashboard** → **My Applications**
2. Click on **"Approved" filter** to see accepted applications
3. Each accepted application shows:
   - Application details (booth size, duration, location)
   - **Participation Fee**: Amount to be paid
   - **Payment Deadline**: 3 days from approval
   - **Payment Status**: `not_paid` or `paid`

### Step 2: Review Payment Details
1. Click **"View Details"** on an accepted application
2. View full application information:
   - Event name and location
   - Booth size and setup duration (for booth events)
   - Staff/attendee information
   - **Participation Fee Amount**
   - **Payment Deadline** (shows days remaining)

### Step 3: Choose Payment Method
Click **"Pay Participation Fee"** button to open payment modal:

#### Option A: Pay with Wallet
1. Click **"Pay with Wallet"** button
2. Confirm the amount and payment
3. Wallet balance is deducted immediately
4. Email receipt is sent automatically

#### Option B: Pay with Stripe Card
1. Click **"Pay with Stripe"** button
2. Stripe payment intent is created
3. Follow Stripe checkout process
4. Confirmation webhook updates payment status
5. Email receipt is sent automatically

### Step 4: Confirmation
- **Payment confirmation** email sent with:
  - Event details
  - Booth size and location
  - Payment amount and method
  - Transaction ID
- **Application status** updates to `payment_status: "paid"`
- Vendor can proceed with event participation setup

## Admin/EventsOffice Staff Flow

### Accepting Applications
When accepting a vendor application:

```javascript
application.approve(adminId); // Sets:
// - status: 'accepted'
// - participation_fee: [based on booth size]
// - payment_deadline: [3 days from now]
// - approved_by: [admin user ID]
// - approved_at: [current date/time]
```

Email is automatically sent with:
- Acceptance confirmation
- Participation fee amount
- Payment deadline
- Payment instructions (wallet or Stripe)

### Viewing Vendor Applications
In **Admin Dashboard** → **Vendor Applications**:
- Filter by status: `pending`, `accepted`, `rejected`
- View payment status for accepted applications
- See payment deadlines and dates
- Track which vendors have paid

## Technical Details

### Database Models

#### VendorApplication
```javascript
{
  _id: ObjectId,
  vendor_user_id: ObjectId (ref: User),
  bazaar_id: ObjectId (ref: Event),
  kind: String, // 'bazaar' or 'booth_event'
  status: String, // 'pending', 'accepted', 'rejected', 'cancelled'
  payment_status: String, // 'not_paid', 'paid', 'refunded'
  participation_fee: Number, // $150 or $400
  payment_deadline: Date, // 3 days after acceptance
  payment_date: Date, // When payment was received
  approved_by: ObjectId (ref: User),
  approved_at: Date,
  // ... other fields
}
```

#### Payment
```javascript
{
  _id: ObjectId,
  user_id: ObjectId (ref: User),
  vendor_application_id: ObjectId (ref: VendorApplication),
  event_id: ObjectId (ref: Event),
  amount: Number,
  payment_method: String, // 'wallet', 'stripe', 'card'
  payment_status: String, // 'pending', 'completed', 'failed', 'refunded'
  stripe_payment_intent_id: String,
  stripe_client_secret: String,
  description: String,
  paid_at: Date,
  refunded_at: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### API Endpoints

#### Vendor Endpoints

**Get Payment Information**
```
GET /api/vendor/applications/:applicationId/payment
Auth: Required (Vendor)
Returns: Payment info, deadline status, days remaining
```

**Pay with Wallet**
```
POST /api/vendor/pay/wallet
Auth: Required (Vendor)
Body: { application_id }
Returns: Payment confirmation, new wallet balance
```

**Create Stripe Payment**
```
POST /api/vendor/pay/stripe/create
Auth: Required (Vendor)
Body: { application_id }
Returns: { client_secret, payment_id, amount }
```

**Confirm Stripe Payment**
```
POST /api/vendor/pay/stripe/confirm
Auth: Required (Vendor)
Body: { payment_id, payment_intent_id }
Returns: Payment confirmation
```

#### Admin Endpoints

**Get All Vendor Applications**
```
GET /api/admin/vendor-applications
Auth: Required (Admin/EventsOffice)
Query: status, kind, page, limit
Returns: Applications with payment status, deadline info
```

**Accept Application** (Automatic payment setup)
```
POST /api/admin/vendor-requests/:applicationId/accept
Auth: Required (Admin/EventsOffice)
Body: { } (auto-calculates fee and deadline)
Side Effects:
  - Sets payment_fee
  - Sets payment_deadline (now + 3 days)
  - Sends acceptance email with payment details
```

## Email Notifications

### Application Acceptance Email
Subject: "Your Bazaar/Booth Application Has Been Accepted!"

Contains:
- Acceptance congratulations
- Event details (name, date, location)
- Booth details (size, duration, location)
- **Participation fee amount**
- **Payment deadline (3 days)**
- **Payment instructions**:
  - Link to pay with wallet
  - Link to pay with Stripe
- Contact for questions

### Payment Receipt Email
Subject: "Payment Receipt - Bazaar/Booth Participation Fee"

Contains:
- Vendor name and company
- Event details
- Booth specifications
- Amount paid
- Payment method used
- Transaction ID
- Payment date/time

## Important Notes

### Payment Deadline Enforcement
- Vendors can view deadline countdown in dashboard
- If deadline passes without payment:
  - Payment button still available
  - Admin notified of unpaid registrations
  - Support can extend deadline on request

### Refund Policy
- Refunds available before event starts (requires support request)
- Marks payment status as `refunded`
- Application status remains `accepted`
- Creates refund transaction record

### Payment Security
- All Stripe payments processed via Stripe API
- PCI compliance handled by Stripe
- Wallet payments use secure deduction method
- All transactions logged with metadata
- Payment validation via Stripe webhooks

## Testing

### Test Scenarios

#### Scenario 1: Wallet Payment
1. Create vendor account with wallet balance
2. Accept vendor application
3. Pay with wallet
4. Verify:
   - Wallet balance deducted
   - Payment status → `paid`
   - Receipt email sent
   - Can view payment in history

#### Scenario 2: Stripe Payment
1. Create vendor account
2. Accept vendor application
3. Create Stripe payment intent
4. Confirm payment with valid test card
5. Verify:
   - Payment status → `paid`
   - Email receipt sent
   - Transaction recorded

#### Scenario 3: Payment Deadline
1. Accept application
2. Verify payment_deadline = now + 3 days
3. Wait for deadline
4. Verify deadline warning shown
5. Support extends deadline (manual process)

## Future Enhancements

1. **Automatic Deadline Reminders**
   - Email 1 day before deadline
   - In-app notification 24 hours before

2. **Partial Refunds**
   - Admin can issue refunds for specific reasons
   - Automatic wallet credit for refunds

3. **Payment Plans**
   - Split payments (e.g., 50% due at acceptance, 50% due 1 week before event)

4. **Invoice Generation**
   - Automated PDF invoices for bookkeeping
   - VAT/Tax calculations (if applicable)

5. **Payment Analytics**
   - Dashboard showing payment rates
   - Revenue tracking by event
   - Unpaid vs. paid vendor reports

## Support

For vendor payment issues, contact:
- Email: support@alahlycenter.com
- Admin Dashboard: View unpaid registrations
- Deadline extensions: Manual admin action

---

**Last Updated**: November 18, 2025
**Status**: Fully Implemented and Tested
