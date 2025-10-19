import Favorite from '../models/Favorite.js';
import Event from '../models/Events.js';
import VendorApplication from '../models/VendorApplication.js';

/* -------------------------- GET /favorites - Get user's favorites -------------------------- */
export const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user._id; // FIXED: Changed from req.user.userId to req.user._id

    // Find all favorite event IDs for this user
    const favorites = await Favorite.find({ user_id: userId }).select('event_id');
    const eventIds = favorites.map(fav => fav.event_id);

    // Fetch full event details
    const events = await Event.find({ _id: { $in: eventIds } }).sort({ start_date: 1 });

    // For bazaar events, fetch approved vendors
    const eventsWithVendors = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject();
        
        if (eventObj.type === "Bazaar") {
          const vendors = await VendorApplication.find({
            bazaar_id: event._id,
            status: "accepted"
          }).select('business_name booth_number products_services');
          
          eventObj.vendors = vendors;
        }
        
        return eventObj;
      })
    );

    res.status(200).json(eventsWithVendors);
  } catch (err) {
    console.error('Error fetching favorites:', err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- POST /favorites - Add to favorites -------------------------- */
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user._id; // FIXED: Changed from req.user.userId to req.user._id
    const { event_id } = req.body;

    if (!event_id) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Check if event exists
    const event = await Event.findById(event_id);
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({ user_id: userId, event_id });
    if (existingFavorite) {
      return res.status(400).json({ error: "Event already in favorites" });
    }

    // Create favorite
    const favorite = await Favorite.create({
      user_id: userId,
      event_id
    });

    res.status(201).json({ 
      message: "Added to favorites successfully",
      favorite 
    });
  } catch (err) {
    console.error('Error adding favorite:', err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- DELETE /favorites/:event_id - Remove from favorites -------------------------- */
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user._id; // FIXED: Changed from req.user.userId to req.user._id
    const { event_id } = req.params;

    const result = await Favorite.findOneAndDelete({ 
      user_id: userId, 
      event_id 
    });

    if (!result) {
      return res.status(404).json({ error: "Favorite not found" });
    }

    res.status(200).json({ 
      message: "Removed from favorites successfully" 
    });
  } catch (err) {
    console.error('Error removing favorite:', err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- GET /favorites/check/:event_id - Check if event is favorited -------------------------- */
export const checkFavorite = async (req, res) => {
  try {
    const userId = req.user._id; // FIXED: Changed from req.user.userId to req.user._id
    const { event_id } = req.params;

    const favorite = await Favorite.findOne({ 
      user_id: userId, 
      event_id 
    });

    res.status(200).json({ 
      isFavorite: !!favorite 
    });
  } catch (err) {
    console.error('Error checking favorite:', err);
    res.status(500).json({ error: "Server error" });
  }
};