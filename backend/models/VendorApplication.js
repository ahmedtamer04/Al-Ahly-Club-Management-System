import mongoose from "mongoose";

const vendorAppSchema = new mongoose.Schema({
  vendor_user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  bazaar_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Event", // Only required for bazaar applications
    required: function() {
      return this.kind === 'bazaar';
    }
  },
  kind: { 
    type: String, 
    enum: ["bazaar", "booth_event"], 
    required: true 
  },
  // Business information (for booth_event applications)
  business_name: {
    type: String,
    trim: true
  },
  business_type: {
    type: String,
    trim: true
  },
  business_description: {
    type: String,
    trim: true
  },
  products_offered: {
    type: String,
    trim: true
  },
  contact_phone: {
    type: String,
    trim: true
  },
  contact_email: {
    type: String,
    trim: true,
    lowercase: true
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
    },
    // For booth_event applications - preferred start date
    preferred_start_date: {
      type: Date
    },
    // For booth_event applications - additional notes
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  // Platform position for booth (4 walls: north/south/east/west, slot 1-6 per wall)
  platform_position: {
    wall: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: function() {
        return this.kind === 'booth_event';
      }
    },
    slot: {
      type: Number,
      min: 1,
      max: 6,
      required: function() {
        return this.kind === 'booth_event';
      }
    }
  },
  // File uploads for vendor company verification
  vendor_documents: {
    tax_card: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    },
    company_logo: {
      file_url: String,
      file_name: String,
      uploaded_at: Date
    }
  },
  // Attendee ID uploads (for each staff member)
  attendee_id_uploads: [
    {
      staff_name: String,
      staff_email: String,
      id_file_url: String,
      id_file_name: String,
      uploaded_at: Date,
      verification_status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      }
    }
  ],
  // Duration in weeks (flattened from application object for easier querying)
  duration_weeks: {
    type: Number,
    min: 1,
    max: 4
  },
  // Preferred start date (flattened from application object for easier querying)
  preferred_start_date: {
    type: Date
  },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "cancelled"], 
    default: "pending" 
  },
  payment_status: {
    type: String,
    enum: ["not_paid", "paid", "refunded"],
    default: "not_paid"
  },
  payment_date: Date,
  participation_fee: {
    type: Number,
    min: 0,
    default: 0
  },
  payment_deadline: {
    type: Date
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
    if (!this.duration_weeks) {
      return next(new Error('Duration in weeks is required for booth event applications'));
    }
    if (!this.platform_position || !this.platform_position.wall || !this.platform_position.slot) {
      return next(new Error('Platform position (wall and slot) is required for booth event applications'));
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

vendorAppSchema.methods.approve = async function(approvedBy) {
  this.status = 'accepted';
  this.approved_by = approvedBy;
  this.approved_at = new Date();
  
  // Calculate participation fee based on booth size
  // 2x2 = $150, 4x4 = $400
  const feeMap = {
    '2x2': 150,
    '4x4': 400
  };
  this.participation_fee = feeMap[this.application?.booth_size] || 150;
  
  // Set payment deadline: 3 days from approval
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 3);
  this.payment_deadline = deadline;
  
  // If this is a bazaar application, add vendor to the bazaar's vendors_participating
  if (this.kind === 'bazaar' && this.bazaar_id) {
    const Event = mongoose.model('Event');
    const User = mongoose.model('User');
    
    try {
      // Get the bazaar event
      const bazaar = await Event.findById(this.bazaar_id);
      // Get the vendor user info
      const vendor = await User.findById(this.vendor_user_id);
      
      if (bazaar && vendor) {
        // Check if vendor is not already in the list
        const alreadyExists = bazaar.bazaar.vendors_participating.some(
          v => v.vendor_id && v.vendor_id.toString() === this.vendor_user_id.toString()
        );
        
        if (!alreadyExists) {
          // Add vendor to bazaar's vendors_participating array
          bazaar.bazaar.vendors_participating.push({
            vendor_id: this.vendor_user_id,
            vendor_name: vendor.vendor_info?.company_name || `${vendor.first_name} ${vendor.last_name}`,
            booth_number: 'TBA', // Will be assigned later
            products: [], // Can be updated later
            registration_date: new Date(),
            payment_status: 'pending'
          });
          
          await bazaar.save();
        }
      }
    } catch (error) {
      console.error('Error adding vendor to bazaar:', error);
      // Continue with approval even if adding to bazaar fails
    }
  }
  
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
