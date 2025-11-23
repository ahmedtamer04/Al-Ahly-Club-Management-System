import mongoose from "mongoose";

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Duration for booth setup (start and end dates)
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > this.start_date;
      },
      message: 'End date must be after start date'
    }
  },
  // Application deadline for vendors
  application_deadline: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value <= this.start_date;
      },
      message: 'Application deadline must be before or on the start date'
    }
  },
  // Maximum number of vendors that can be selected
  max_vendors: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Available booth positions (walls and slots)
  available_positions: [{
    wall: {
      type: String,
      enum: ["north", "south", "east", "west"],
      required: true
    },
    slot: {
      type: Number,
      min: 1,
      max: 6,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ["draft", "open", "closed", "completed", "cancelled"],
    default: "draft"
  },
  // Selected vendors (after poll is closed)
  selected_vendors: [{
    vendor_application_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PollApplication"
    },
    vendor_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assigned_position: {
      wall: {
        type: String,
        enum: ["north", "south", "east", "west"]
      },
      slot: {
        type: Number,
        min: 1,
        max: 6
      }
    },
    selected_at: {
      type: Date,
      default: Date.now
    },
    selected_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  }],
  closed_at: Date,
  cancelled_at: Date,
  cancelled_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  cancellation_reason: {
    type: String,
    trim: true,
    maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
  }
}, { timestamps: true });

// Indexes for performance
pollSchema.index({ created_by: 1 });
pollSchema.index({ status: 1 });
pollSchema.index({ start_date: 1, end_date: 1 });
pollSchema.index({ application_deadline: 1 });

// Instance methods
pollSchema.methods.close = function(selectedVendors = []) {
  this.status = 'closed';
  this.closed_at = new Date();
  if (selectedVendors.length > 0) {
    this.selected_vendors = selectedVendors;
  }
  return this.save();
};

pollSchema.methods.cancel = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelled_at = new Date();
  this.cancelled_by = cancelledBy;
  if (reason) {
    this.cancellation_reason = reason;
  }
  return this.save();
};

pollSchema.methods.open = function() {
  this.status = 'open';
  return this.save();
};

export default mongoose.model("Poll", pollSchema);

