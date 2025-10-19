import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can't favorite the same event twice
favoriteSchema.index({ user_id: 1, event_id: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;