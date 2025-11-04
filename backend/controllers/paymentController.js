import User from "../models/User.js";
import Payment from "../models/Payment.js";
import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import Stripe from "stripe";

// Lazy initialization of Stripe - will be initialized when first needed
let stripe = null;

const getStripe = () => {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    console.log('✅ Initializing Stripe with key:', process.env.STRIPE_SECRET_KEY.substring(0, 20) + '...');
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
};

// Get user wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      balance: user.wallet?.balance || 0,
      currency: user.wallet?.currency || 'USD',
      transactions: user.wallet?.transactions || []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Top up wallet (for testing - in production this would be via Stripe)
export const topUpWallet = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize wallet if it doesn't exist
    if (!user.wallet) {
      user.wallet = { balance: 0, currency: 'USD', transactions: [] };
    }

    // Add amount to wallet
    user.wallet.balance += amount;
    user.wallet.transactions.push({
      type: 'top-up',
      amount: amount,
      description: 'Wallet top-up',
      payment_method: 'stripe',
      timestamp: new Date()
    });

    await user.save();

    res.json({
      message: "Wallet topped up successfully",
      balance: user.wallet.balance,
      transaction: user.wallet.transactions[user.wallet.transactions.length - 1]
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Pay with wallet
export const payWithWallet = async (req, res) => {
  try {
    const { event_id, registration_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const user = await User.findById(req.user._id);
    const event = await Event.findById(event_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get the price based on event type
    let amount = 0;
    if (event.type === 'Trip' && event.trip?.price) {
      amount = event.trip.price;
    } else if (event.type === 'Workshop' && event.workshop?.price) {
      amount = event.workshop.price;
    } else {
      return res.status(400).json({ message: "Event has no price set" });
    }

    // Check if user has sufficient balance
    const currentBalance = user.wallet?.balance || 0;
    if (currentBalance < amount) {
      return res.status(400).json({ 
        message: "Insufficient wallet balance",
        required: amount,
        available: currentBalance
      });
    }

    // Deduct from wallet
    user.wallet.balance -= amount;
    user.wallet.transactions.push({
      type: 'payment',
      amount: -amount,
      description: `Payment for ${event.name}`,
      reference: event_id,
      payment_method: 'wallet',
      timestamp: new Date()
    });

    await user.save();

    // Create payment record
    const payment = await Payment.create({
      user_id: req.user._id,
      event_id: event_id,
      registration_id: registration_id,
      amount: amount,
      payment_method: 'wallet',
      payment_status: 'completed',
      description: `Payment for ${event.name}`,
      paid_at: new Date()
    });

    // Update registration payment status if registration_id provided
    if (registration_id) {
      await Registration.findByIdAndUpdate(registration_id, {
        payment_status: 'paid',
        payment_method: 'wallet',
        paid_at: new Date()
      });
    }

    res.json({
      success: true,
      message: "Payment successful",
      payment: payment,
      new_balance: user.wallet.balance
    });
  } catch (err) {
    console.error('Payment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Create Stripe payment intent (for card payment)
export const createStripePayment = async (req, res) => {
  try {
    const { event_id, registration_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    const event = await Event.findById(event_id);

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get the price based on event type
    let amount = 0;
    if (event.type === 'Trip' && event.trip?.price) {
      amount = event.trip.price;
    } else if (event.type === 'Workshop' && event.workshop?.price) {
      amount = event.workshop.price;
    } else {
      return res.status(400).json({ message: "Event has no price set" });
    }

    // Get Stripe instance (lazy initialization)
    const stripe = getStripe();
    
    if (!stripe) {
      console.error('Stripe initialization failed. STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'EXISTS' : 'MISSING');
      return res.status(500).json({ 
        message: "Stripe is not configured. Please set STRIPE_SECRET_KEY in environment variables." 
      });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: 'usd',
      metadata: {
        event_id: event_id,
        registration_id: registration_id || 'none',
        user_id: req.user._id.toString(),
        event_name: event.name
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Create pending payment record
    const payment = await Payment.create({
      user_id: req.user._id,
      event_id: event_id,
      registration_id: registration_id,
      amount: amount,
      payment_method: 'stripe',
      payment_status: 'pending',
      description: `Payment for ${event.name}`,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_client_secret: paymentIntent.client_secret
    });

    res.json({
      success: true,
      message: "Payment intent created",
      client_secret: paymentIntent.client_secret,
      payment_id: payment._id,
      amount: amount
    });
  } catch (err) {
    console.error('Stripe payment error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Confirm Stripe payment
export const confirmStripePayment = async (req, res) => {
  try {
    const { payment_id, payment_intent_id } = req.body;

    if (!payment_id) {
      return res.status(400).json({ message: "Payment ID is required" });
    }

    const payment = await Payment.findById(payment_id);

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Verify payment with Stripe API
    const stripe = getStripe();
    if (stripe && payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
          return res.status(400).json({ 
            message: "Payment not completed. Status: " + paymentIntent.status 
          });
        }
      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        return res.status(500).json({ 
          message: "Failed to verify payment with Stripe",
          error: stripeError.message 
        });
      }
    }

    // Mark payment as completed
    payment.payment_status = 'completed';
    payment.paid_at = new Date();
    await payment.save();

    // Update registration payment status if registration_id exists
    if (payment.registration_id) {
      await Registration.findByIdAndUpdate(payment.registration_id, {
        payment_status: 'paid',
        payment_method: 'stripe',
        paid_at: new Date()
      });
    }

    // Add transaction to user wallet history (for record keeping)
    const user = await User.findById(req.user._id);
    if (!user.wallet) {
      user.wallet = { balance: 0, currency: 'USD', transactions: [] };
    }
    
    user.wallet.transactions.push({
      type: 'payment',
      amount: -payment.amount,
      description: payment.description,
      reference: payment.event_id.toString(),
      payment_method: 'stripe',
      stripe_payment_id: payment_intent_id,
      timestamp: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "Payment confirmed successfully",
      payment: payment
    });
  } catch (err) {
    console.error('Payment confirmation error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Get payment history
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.user._id })
      .populate('event_id', 'name type start_date')
      .sort({ createdAt: -1 });

    res.json({
      payments: payments,
      total: payments.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get wallet transactions
export const getWalletTransactions = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const transactions = user.wallet?.transactions || [];
    
    res.json({
      transactions: transactions.sort((a, b) => b.timestamp - a.timestamp),
      total: transactions.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
