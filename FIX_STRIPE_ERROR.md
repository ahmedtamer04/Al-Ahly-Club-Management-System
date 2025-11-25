# Fix: "Could not find Elements context" Error

## The Error You're Seeing
```
Error: Could not find Elements context; 
You need to wrap the part of your app that calls useStripe() in an <Elements> provider.
```

## Why This Happens
This error occurs when:
1. ❌ Stripe publishable key is not set
2. ❌ Stripe publishable key still contains placeholder text `PASTE_YOUR_PUBLISHABLE_KEY_HERE`
3. ❌ Frontend server wasn't restarted after adding the key

## ✅ How to Fix It

### Step 1: Check Your Stripe Key

Open `frontend/.env.local` and verify it looks like this:

**❌ WRONG (will cause error):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_PASTE_YOUR_PUBLISHABLE_KEY_HERE
```

**✅ CORRECT (should work):**
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51OhLiZ...your_actual_key_here...4Fc3tQ4
```

The key should:
- Start with `pk_test_` (for test mode)
- Be a long string (about 107 characters)
- NOT contain the word "PASTE"

### Step 2: Restart Frontend Server

**IMPORTANT:** After editing `.env.local`, you MUST restart the server:

```powershell
# In your frontend terminal:
# 1. Stop the server (Ctrl+C)
# 2. Start it again:
cd C:\Projects\Q3 2025\Al-Ahly\frontend
npm run dev
```

### Step 3: Clear Browser Cache

```
Press: Ctrl + Shift + R (Windows)
or
Press F12 → Right-click refresh button → "Empty Cache and Hard Reload"
```

### Step 4: Check Browser Console

Open browser console (F12) and look for:

**✅ Good - Should see:**
```
✓ Stripe publishable key loaded: pk_test_51OhLiZ...
```

**❌ Bad - If you see:**
```
⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set
or
⚠️ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY contains placeholder text
```

Then go back to Step 1 and fix your `.env.local` file.

## 🎯 Quick Checklist

- [ ] Added actual Stripe key to `frontend/.env.local`
- [ ] Key starts with `pk_test_`
- [ ] Key does NOT contain "PASTE" or "YOUR"
- [ ] Restarted frontend server (`npm run dev`)
- [ ] Cleared browser cache (Ctrl+Shift+R)
- [ ] Checked browser console for "✓ Stripe publishable key loaded"

## 📋 Correct File Content

### `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51OhLiZ2JKldE4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4Fc3tQ4
```
(Replace with YOUR actual key from Stripe Dashboard)

## 🔍 Still Not Working?

### 1. Verify Stripe Key is Valid
Go to: https://dashboard.stripe.com/test/apikeys

Copy the **Publishable key** (the one that's visible by default, NOT the secret key)

### 2. Check Environment Variable is Loading
Add this temporarily to any page to debug:

```javascript
console.log('Stripe key exists?', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
console.log('First 20 chars:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 20));
```

Should output:
```
Stripe key exists? true
First 20 chars: pk_test_51OhLiZ2JKld
```

If it outputs `false` or `undefined`, the env variable isn't loading.

### 3. Common Mistakes

**❌ Wrong file location:**
- Should be: `frontend/.env.local`
- NOT: `backend/.env.local`
- NOT: `frontend/.env`
- NOT: `.env.local` (in root folder)

**❌ Wrong variable name:**
- Should be: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- NOT: `STRIPE_PUBLISHABLE_KEY` (missing NEXT_PUBLIC_)
- NOT: `NEXT_PUBLIC_STRIPE_KEY`

**❌ Extra spaces:**
```bash
# WRONG - has spaces
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_abc123

# CORRECT - no spaces
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_abc123
```

**❌ Quotes around key:**
```bash
# WRONG - has quotes
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_abc123"

# CORRECT - no quotes
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_abc123
```

## 🆘 If Nothing Works

1. **Delete and recreate `.env.local`:**
   ```powershell
   cd C:\Projects\Q3 2025\Al-Ahly\frontend
   del .env.local
   notepad .env.local
   ```
   
   Paste this and save:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_key_here
   ```

2. **Kill all Node processes and restart:**
   ```powershell
   # Kill all node processes
   taskkill /F /IM node.exe
   
   # Start backend
   cd C:\Projects\Q3 2025\Al-Ahly\backend
   npm run dev
   
   # Start frontend
   cd C:\Projects\Q3 2025\Al-Ahly\frontend
   npm run dev
   ```

3. **Use wallet payment instead:**
   - When the payment modal opens
   - Click "Pay with Wallet" instead of card
   - This doesn't require Stripe configuration

---

**After fixing, you should see a nice payment form instead of the error!** 🎉
