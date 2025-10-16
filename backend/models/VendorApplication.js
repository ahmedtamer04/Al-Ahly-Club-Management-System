import mongoose from "mongoose";

const vendorAppSchema = new mongoose.Schema({
  vendor_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  bazaar_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", // Changed from "Bazaar" to "Event"
    required: true 
  },
  kind: { 
    type: String, 
    enum: ["bazaar", "booth_event"], 
    required: true 
  },
  application: {
    // For bazaar applications - names and emails with booth size selection
    bazaar_staff: {
      type: [{
        name: { 
          type: String, 
          required: function() {
            return this.parent().parent().kind === 'bazaar';
          },
          trim: true 
        },
        email: { 
          type: String, 
          required: function() {
            return this.parent().parent().kind === 'bazaar';
          },
          trim: true,
          lowercase: true,
          match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        }
      }],
      validate: {
        validator: function(arr) {
          if (this.parent().kind === 'bazaar') {
            return arr && arr.length >= 1 && arr.length <= 5;
          }
          return true;
        },
        message: 'Bazaar staff must have between 1 and 5 members'
      }
    },
    // For booth event applications - names and emails
    booth_staff: {
      type: [{
        name: { 
          type: String, 
          required: function() {
            return this.parent().parent().kind === 'booth_event';
          },
          trim: true 
        },
        email: { 
          type: String, 
          required: function() {
            return this.parent().parent().kind === 'booth_event';
          },
          trim: true,
          lowercase: true,
          match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
        }
      }],
      validate: {
        validator: function(arr) {
          if (this.parent().kind === 'booth_event') {
            return arr && arr.length >= 1 && arr.length <= 5;
          }
          return true;
        },
        message: 'Booth event staff must have between 1 and 5 members'
      }
    },
    booth_size: {
      type: String,
      enum: {
        values: ["2x2", "4x4"],
        message: 'Booth size must be either 2x2 or 4x4'
      },
      required: function() {
        return this.parent().kind === 'bazaar' || this.parent().kind === 'booth_event';
      }
    },
    // For booth_event applications only
    setup_duration_weeks: {
      type: Number,
      min: [1, 'Setup duration must be at least 1 week'],
      max: [4, 'Setup duration cannot exceed 4 weeks'],
      validate: {
        validator: function(value) {
          // Only required for booth_event applications
          if (this.kind === 'booth_event') {
            return value != null && Number.isInteger(value);
          }
          return true;
        },
        message: 'Setup duration in weeks is required for booth event applications'
      }
    },
    // For booth_event applications only
    booth_location: {
      type: {
        x_coordinate: {
          type: Number,
          min: 0,
          max: 100
        },
        y_coordinate: {
          type: Number,
          min: 0,
          max: 100
        },
        zone: {
          type: String,
          enum: ["A", "B", "C", "D"],
          required: true
        },
        description: String
      },
      validate: {
        validator: function(value) {
          // Only required for booth_event applications
          if (this.kind === 'booth_event') {
            return value != null && value.zone != null;
          }
          return true;
        },
        message: 'Booth location is required for booth event applications'
      }
    }
  },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected"], 
    default: "pending" 
  },
  rejection_reason: {
    type: String,
    trim: true
  },
  approved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  approved_at: Date
}, { timestamps: true });

// Index for performance
vendorAppSchema.index({ vendor_user_id: 1, bazaar_id: 1, kind: 1 });
vendorAppSchema.index({ status: 1 });
vendorAppSchema.index({ bazaar_id: 1, status: 1 });

// Validation middleware
vendorAppSchema.pre('save', function(next) {
  // Validate booth_event specific fields
  if (this.kind === 'booth_event') {
    if (!this.application.setup_duration_weeks) {
      return next(new Error('Setup duration in weeks is required for booth event applications'));
    }
    if (!this.application.booth_location || !this.application.booth_location.zone) {
      return next(new Error('Booth location is required for booth event applications'));
    }
    if (!this.application.booth_staff || this.application.booth_staff.length === 0) {
      return next(new Error('Booth staff with names and emails is required for booth event applications'));
    }
  }
  
  // Validate bazaar specific fields
  if (this.kind === 'bazaar') {
    if (!this.application.bazaar_staff || this.application.bazaar_staff.length === 0) {
      return next(new Error('Bazaar staff with names and emails is required for bazaar applications'));
    }
    if (!this.application.booth_size) {
      return next(new Error('Booth size is required for bazaar applications'));
    }
  }
  
  next();
});

// Instance methods
vendorAppSchema.methods.canEdit = function() {
  return this.status === 'pending';
};

vendorAppSchema.methods.approve = function(approvedBy) {
  this.status = 'accepted';
  this.approved_by = approvedBy;
  this.approved_at = new Date();
  return this.save();
};

vendorAppSchema.methods.reject = function(reason, rejectedBy) {
  this.status = 'rejected';
  this.rejection_reason = reason;
  this.approved_by = rejectedBy;
  this.approved_at = new Date();
  return this.save();
};

export default mongoose.model("VendorApplication", vendorAppSchema);
