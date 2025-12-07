import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  // ========================================
  // COMMON FIELDS (All Event Types)
  // ========================================
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  type: {
    type: String,
    required: true,
    enum: ["Workshop", "Trip", "Bazaar", "Booth", "Conference"],
    index: true
  },
  
  location: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  
  short_description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  
  start_date: {
    type: Date,
    required: true
  },
  
  end_date: {
    type: Date,
    required: true
  },
  
  time: {
    type: String,
    required: true,
    trim: true
  },
  
  status: {
    type: String,
    // Add 'archived' so events can be explicitly archived after they have passed
    enum: ["upcoming", "active", "completed", "cancelled", "archived"],
    default: "upcoming"
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  
  // Event access restrictions - which roles can view/register
  allowed_roles: {
    type: [String],
    enum: ["Student", "Staff", "TA", "Professor", "Vendor", "Admin", "EventsOffice"],
    default: [] // Empty array means all roles can access
  },
  
  // ========================================
  // RATING FIELDS
  // ========================================
  average_rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  
  total_ratings: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // ========================================
  // WORKSHOP SPECIFIC FIELDS
  // ========================================
  workshop: {
    full_agenda: {
      type: String,
      required: function() { return this.type === "Workshop"; },
      trim: true
    },
    faculty_responsible: {
      type: String,
      required: function() { return this.type === "Workshop"; },
      trim: true
    },
    professors_participating: [{
      type: String,
      required: function() { return this.type === "Workshop"; },
      trim: true
    }],
    required_budget: {
      type: Number,
      required: function() { return this.type === "Workshop"; },
      min: 0
    },
    funding_source: {
      type: String,
      required: function() { return this.type === "Workshop"; },
      enum: ["GUC", "EXTERNAL"]
    },
    extra_resources: {
      type: String,
      trim: true
    },
    capacity: {
      type: Number,
      required: function() { return this.type === "Workshop"; },
      min: 1
    },
    registration_deadline: {
      type: Date,
      required: function() { return this.type === "Workshop"; }
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    // Approval workflow fields
    approval_status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "revision_requested"],
      default: "pending"
    },
    requested_edits: {
      type: String,
      trim: true
    },
    rejection_reason: {
      type: String,
      trim: true
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewed_at: {
      type: Date
    }
  },
  
  // ========================================
  // TRIP SPECIFIC FIELDS
  // ========================================
  trip: {
    price: {
      type: Number,
      required: function() { return this.type === "Trip"; },
      min: 0
    },
    capacity: {
      type: Number,
      required: function() { return this.type === "Trip"; },
      min: 1
    },
    registration_deadline: {
      type: Date,
      required: function() { return this.type === "Trip"; }
    }
  },
  
  // ========================================
  // BAZAAR SPECIFIC FIELDS
  // ========================================
  bazaar: {
    registration_deadline: {
      type: Date,
      required: function() { return this.type === "Bazaar"; }
    },
    vendors_participating: [{
      vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      vendor_name: {
        type: String,
        trim: true
      },
      booth_number: {
        type: String,
        trim: true
      },
      products: [{
        type: String,
        trim: true
      }],
      registration_date: {
        type: Date,
        default: Date.now
      },
      payment_status: {
        type: String,
        enum: ["pending", "paid", "cancelled"],
        default: "pending"
      }
    }]
  },
  
  // ========================================
  // BOOTH SPECIFIC FIELDS
  // ========================================
  booth: {
    vendors: [{
      vendor_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      vendor_name: {
        type: String,
        trim: true,
        required: true
      },
      company_name: {
        type: String,
        trim: true
      },
      contact_info: {
        phone: String,
        email: String
      },
      booth_assignment: {
        type: String,
        trim: true
      },
      setup_time: {
        type: String,
        trim: true
      },
      assigned_date: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // ========================================
  // CONFERENCE SPECIFIC FIELDS
  // ========================================
  conference: {
    campus: {
      type: String,
      required: function() { return this.type === "Conference"; },
      enum: ["GUC", "GUC Berlin"]
    },
    professors_participating: [{
      type: String,
      required: function() { return this.type === "Conference"; },
      trim: true
    }],
    full_agenda: {
      type: String,
      required: function() { return this.type === "Conference"; },
      trim: true
    },
    conference_website: {
      type: String,
      required: function() { return this.type === "Conference"; },
      trim: true
    },
    required_budget: {
      type: Number,
      required: function() { return this.type === "Conference"; },
      min: 0
    },
    funding_source: {
      type: String,
      required: function() { return this.type === "Conference"; },
      enum: ["GUC", "EXTERNAL"]
    },
    extra_required_sources: {
      type: String,
      trim: true
    }
  }

}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ========================================
// VIRTUAL PROPERTIES
// ========================================
eventSchema.virtual('available_spots').get(function() {
  let capacity = 0;
  switch(this.type) {
    case 'Workshop':
      capacity = this.workshop?.capacity || 0;
      break;
    case 'Trip':
      capacity = this.trip?.capacity || 0;
      break;
    case 'Bazaar':
      return this.bazaar?.vendors_participating?.length || 0;
    case 'Booth':
      return this.booth?.vendors?.length || 0;
    case 'Conference':
      return 'Unlimited';
    default:
      return 0;
  }
  
  if (this.type === 'Conference') return 'Unlimited';
  
  // Note: This is synchronous approximation
  // For exact count, query Registration model separately
  return capacity;
});

eventSchema.virtual('is_full').get(function() {
  if (this.type === 'Conference') return false;
  return this.available_spots <= 0;
});

eventSchema.virtual('is_past').get(function() {
  return this.end_date < new Date();
});

eventSchema.virtual('registration_open').get(function() {
  const now = new Date();
  let deadline;
  
  switch(this.type) {
    case 'Workshop':
      deadline = this.workshop?.registration_deadline;
      break;
    case 'Trip':
      deadline = this.trip?.registration_deadline;
      break;
    case 'Bazaar':
      deadline = this.bazaar?.registration_deadline;
      break;
    default:
      deadline = this.start_date;
  }
  
  return deadline > now && !this.is_past && this.status === 'upcoming';
});

// ========================================
// MIDDLEWARE
// ========================================

// Validation middleware
eventSchema.pre('save', function(next) {
  // Validate dates
  if (this.start_date >= this.end_date) {
    next(new Error('End date must be after start date'));
  }
  
  // Type-specific validations
  if (this.type === 'Workshop' && this.workshop?.registration_deadline) {
    if (this.workshop.registration_deadline >= this.start_date) {
      next(new Error('Workshop registration deadline must be before start date'));
    }
  }
  
  if (this.type === 'Trip' && this.trip?.registration_deadline) {
    if (!(this.trip.registration_deadline < this.start_date)) {
      this.invalidate("trip.registration_deadline", "Trip registration deadline must be before start_date");
    }
  }
  
  if (this.type === 'Bazaar' && this.bazaar?.registration_deadline) {
    if (this.bazaar.registration_deadline >= this.start_date) {
      next(new Error('Bazaar registration deadline must be before start date'));
    }
  }
  
  next();
});

// ========================================
// INDEXES
// ========================================
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ start_date: 1 });
eventSchema.index({ created_by: 1 });
eventSchema.index({ name: 'text', short_description: 'text' });

// ========================================
// STATIC METHODS
// ========================================
eventSchema.statics.findByType = function(type) {
  return this.find({ type: type, status: { $ne: 'cancelled' } });
};

eventSchema.statics.findUpcoming = function(type = null) {
  const filter = {
    start_date: { $gt: new Date() },
    status: 'upcoming'
  };
  if (type) filter.type = type;
  return this.find(filter).sort({ start_date: 1 });
};

// ========================================
// INSTANCE METHODS
// ========================================

// Calculate actual available spots by checking Registration database
eventSchema.methods.calculateAvailableSpots = async function() {
  // Conference events have unlimited capacity
  if (this.type === 'Conference') {
    return Infinity;
  }
  
  // Get total capacity for this event type
  let capacity = 0;
  switch(this.type) {
    case 'Workshop':
      capacity = this.workshop?.capacity || 0;
      break;
    case 'Trip':
      capacity = this.trip?.capacity || 0;
      break;
    default:
      return 0;
  }
  
  // Count active registrations (registered status with paid or free payment status)
  const Registration = mongoose.model('Registration');
  const activeRegistrations = await Registration.countDocuments({
    event_id: this._id,
    status: 'registered',
    payment_status: { $in: ['paid', 'free'] }
  });
  
  // Calculate remaining spots
  return Math.max(0, capacity - activeRegistrations);
};
eventSchema.methods.canEdit = function() {
  return this.start_date > new Date() && this.status !== 'cancelled';
};

eventSchema.methods.addVendor = function(vendorData) {
  if (this.type === 'Bazaar') {
    this.bazaar.vendors_participating.push(vendorData);
  } else if (this.type === 'Booth') {
    this.booth.vendors.push(vendorData);
  } else {
    throw new Error('Only Bazaars and Booths can have vendors');
  }
  return this.save();
};

export default mongoose.model("Event", eventSchema);