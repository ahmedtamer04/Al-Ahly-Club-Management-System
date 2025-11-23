import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  event_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Event',
  },
  registration_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Registration',
  },
  vendor_application_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VendorApplication',
  },
  amount: { 
    type: Number, 
    required: true,
    min: 0
  },
  currency: { 
    type: String, 
    default: 'USD' 
  },
  payment_method: { 
    type: String, 
    enum: ['wallet', 'stripe', 'card'],
    required: true 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending' 
  },
  
  // Stripe-specific fields
  stripe_payment_intent_id: { type: String },
  stripe_client_secret: { type: String },
  stripe_payment_method_id: { type: String },
  
  // Payment details
  description: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  
  // Timestamps
  paid_at: { type: Date },
  refunded_at: { type: Date },
  
}, { timestamps: true });

// Index for faster queries
paymentSchema.index({ user_id: 1, event_id: 1 });
paymentSchema.index({ payment_status: 1 });
paymentSchema.index({ stripe_payment_intent_id: 1 });

export default mongoose.model("Payment", paymentSchema);
