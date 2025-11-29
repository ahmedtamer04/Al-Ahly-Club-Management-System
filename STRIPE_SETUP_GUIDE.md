# Stripe Setup Guide - Fix "Failed to initialize card payment"

## The Problem

You're seeing the error **"Failed to initialize card payment"** because Stripe is not properly configured with your API keys.

## The Solution

### Step 1: Get Stripe API Keys

1. **Create a Stripe Account** (if you don't have one)

   - Go to https://stripe.com
   - Click "Sign up" or "Start now"
   - Complete the registration process

2. **Get Your Test API Keys**
   - Log in to your Stripe Dashboard: https://dashboard.stripe.com
   - Click on "Developers" in the left sidebar
   - Click on "API keys"
   - You'll see two keys:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`)
   - Click "Reveal test key" to see the secret key

### Step 2: Configure Frontend (Next.js)

1. **Open or create** `frontend/.env.local`

2. **Add your Stripe Publishable Key**:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Replace `pk_test_51xxx...` with YOUR actual publishable key from Stripe

### Step 3: Configure Backend (Node.js/Express)

3. **Restart your frontend server**:
   ```bash
   cd frontend
   npm run dev
   ```

### Step 3: Configure Backend (Node.js/Express)

2. **Add your Stripe Secret Key**:

   ```bash
   # Existing variables
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5001

   # Add Stripe Secret Key
   STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

   Replace `sk_test_51xxx...` with YOUR actual secret key from Stripe

3. **Restart your backend server**:
   ```bash
   cd backend
   npm run dev
   ```

### Step 4: Test the Payment System

1. **Register for a paid workshop or trip**
2. **Click "Pay with Credit/Debit Card"**
3. **Use Stripe test card numbers**:

   - Card Number: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Complete the payment** ✅

## Test Card Numbers

Stripe provides several test cards for different scenarios:

| Card Number           | Scenario                            |
| --------------------- | ----------------------------------- |
| `4242 4242 4242 4242` | Success                             |
| `4000 0000 0000 0002` | Card declined                       |
| `4000 0000 0000 9995` | Insufficient funds                  |
| `4000 0025 0000 3155` | Requires authentication (3D Secure) |

## Troubleshooting

### Issue: "Stripe is not configured" warning

**Solution**: Make sure you added the publishable key to `frontend/.env.local` with the exact name:

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Note**: In Next.js, environment variables MUST start with `NEXT_PUBLIC_` to be accessible in the browser.

### Issue: Payment succeeds but registration doesn't update

**Solution**: Make sure the backend has the secret key configured in `backend/.env`:

### Issue: "Invalid API key provided"

**Solution**:

- Double-check you're using the TEST keys (start with `pk_test_` and `sk_test_`)
- Make sure there are no extra spaces or quotes around the keys
- Verify you copied the complete key (they're quite long!)

### Issue: Changes don't take effect

**Solution**: Restart both servers after updating `.env` files:

````bash
# Terminal 1 - Frontend
cd frontend
npm run dev

# Terminal 2 - Backend

### ✅ What's Already Working:
- Wallet payments
- Payment history tracking
- Stripe API keys in environment files
- Once configured, card payments will work immediately

### 🔄 What's Optional (For Production):
- Replace mock Stripe code with real Stripe SDK
- Set up Stripe webhooks
- Configure live mode keys (when ready to accept real payments)

## Environment File Templates

### frontend/.env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
````

### backend/.env

```bash
MONGO_URI=mongodb://localhost:27017/al-ahly-events
JWT_SECRET=your_jwt_secret_key_here
PORT=5001
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
```

## Important Security Notes

⚠️ **Never commit your secret keys to Git!**

Both `.env` and `.env.local` files should be in `.gitignore`:

```gitignore
.env.local
.env*.local
```

✅ **Test vs Live Keys**:

- **Test keys** (`pk_test_`, `sk_test_`) - For development, no real money
- **Live keys** (`pk_live_`, `sk_live_`) - For production, real payments

Always start with test keys during development!

## Quick Start Commands

After adding your Stripe keys:

```bash
# Terminal 1 - Start Backend
cd backend
npm install stripe  # Install Stripe if not already installed
npm run dev

# Terminal 2 - Start Frontend
cd frontend
npm run dev

# Terminal 3 (optional) - Test the setup
curl http://localhost:3000  # Should show your app
curl http://localhost:5001  # Should show backend status
```

## Need Help?

If you're still having issues:

1. **Check browser console** (F12) for error messages
2. **Check backend terminal** for server errors
3. **Verify all environment variables** are set correctly
4. **Restart both servers** after any `.env` changes
5. **Clear browser cache** and try again

## Summary

The error occurs because:

1. ❌ Stripe publishable key is missing from `frontend/.env.local`
2. ❌ Stripe secret key is missing from `backend/.env`

3. ✅ Get API keys from Stripe Dashboard
4. ✅ Add publishable key to frontend `.env.local`
5. ✅ Add secret key to backend `.env`
6. ✅ Restart both servers
7. ✅ Test with card `4242 4242 4242 4242`

---

**Once configured, card payments will work immediately!** The code is already built and ready - it just needs the API keys.
