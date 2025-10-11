import mongoose from "mongoose";

const bazaarSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: [true, 'Bazaar name is required'],
    trim: true,
    maxlength: [100, 'Bazaar name cannot exceed 100 characters']
  },

  // Date and Time Information
  start_date: { 
    type: Date, 
    required: [true, 'Start date is required']
  },
  
  end_date: { 
    type: Date, 
    required: [true, 'End date is required']
  },
  
  time: { 
    type: String, 
    required: [true, 'Time is required'],
    trim: true,
    validate: {
      validator: function(v) {
        // Accepts formats like "9:00 AM - 5:00 PM" or "09:00-17:00"
        return /^.{3,50}$/.test(v);
      },
      message: 'Time must be between 3 and 50 characters'
    }
  },

  // Location
  location: { 
    type: String, 
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },

  // Short Description
  short_description: { 
    type: String, 
    required: [true, 'Short description is required'],
    trim: true,
    maxlength: [300, 'Short description cannot exceed 300 characters']
  },

  // Registration Deadline
  registration_deadline: {
    type: Date,
    required: [true, 'Registration deadline is required']
  },

  // System Fields (automatically managed)
  created_by: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true
  },
  
  status: { 
    type: String, 
    enum: ["upcoming", "active", "completed", "cancelled"],
    default: "upcoming" 
  },

  // Vendor tracking (optional - can be added later)
  registered_vendors: [{
    vendor_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User"
    },
    registration_date: { 
      type: Date, 
      default: Date.now 
    }
  }]

}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Virtual Properties
bazaarSchema.virtual('is_past').get(function() {
  return this.end_date < new Date();
});

bazaarSchema.virtual('registration_open').get(function() {
  return this.registration_deadline > new Date() && !this.is_past;
});

// Instance Methods
bazaarSchema.methods.canEdit = function() {
  // Can only edit if bazaar hasn't started yet
  return this.start_date > new Date();
};

// Validation Middleware
bazaarSchema.pre('save', function(next) {
  // Validate that end_date is after start_date
  if (this.start_date && this.end_date && this.start_date > this.end_date) {
    next(new Error('End date must be after start date'));
  }
  
  // Validate that registration deadline is before start date
  if (this.registration_deadline && this.start_date && this.registration_deadline >= this.start_date) {
    next(new Error('Registration deadline must be before start date'));
  }
  
  next();
});

// Indexes for performance
bazaarSchema.index({ start_date: 1 });
bazaarSchema.index({ status: 1 });
bazaarSchema.index({ registration_deadline: 1 });

export default mongoose.model("Bazaar", bazaarSchema);