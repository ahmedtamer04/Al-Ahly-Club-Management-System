import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import Favorite from "../models/Favorite.js";
import User from "../models/User.js";
import GymSession from "../models/GymSession.js";
import GymSessionRegistration from "../models/GymSessionRegistration.js";

// Get personalized event recommendations for a user
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's event registration history
    const userRegistrations = await Registration.find({
      user_id: userId,
      status: 'registered'
    }).populate('event_id');

    // Get user's gym registration history
    const userGymRegistrations = await GymSessionRegistration.find({
      user_id: userId,
      status: 'registered'
    }).populate('gym_session_id');

    // Get user's favorites
    const userFavorites = await Favorite.find({
      user_id: userId
    }).populate('event_id');

    // Extract event types, gym types, and faculties from history
    const registeredEventTypes = new Set();
    const favoritedEventTypes = new Set();
    const registeredEventIds = new Set();
    const registeredGymTypes = new Set();
    const registeredGymIds = new Set();
    const hasGymHistory = userGymRegistrations.length > 0;

    userRegistrations.forEach(reg => {
      if (reg.event_id) {
        registeredEventTypes.add(reg.event_id.type);
        registeredEventIds.add(reg.event_id._id.toString());
      }
    });

    userGymRegistrations.forEach(reg => {
      if (reg.gym_session_id) {
        registeredGymTypes.add(reg.gym_session_id.type);
        registeredGymIds.add(reg.gym_session_id._id.toString());
      }
    });

    userFavorites.forEach(fav => {
      if (fav.event_id) {
        favoritedEventTypes.add(fav.event_id.type);
      }
    });

    // Get upcoming events that students can register for
    const now = new Date();
    const upcomingEvents = await Event.find({
      status: { $in: ['upcoming', 'active'] },
      start_date: { $gte: now },
      _id: { $nin: Array.from(registeredEventIds) }, // Exclude already registered events
      type: { $in: ['Workshop', 'Trip'] }, // Only Workshop and Trip are registerable
      $and: [
        {
          $or: [
            { 'workshop.approval_status': 'accepted' }, // Workshops must be accepted
            { type: 'Trip' } // Trips don't need approval
          ]
        },
        {
          $or: [
            { 'workshop.registration_deadline': { $gte: now } }, // Workshop deadline not passed
            { 'trip.registration_deadline': { $gte: now } } // Trip deadline not passed
          ]
        }
      ]
    }).sort({ start_date: 1 }).limit(40);

    // Get upcoming gym sessions (not cancelled)
    const upcomingGymSessions = await GymSession.find({
      status: 'scheduled',
      date: { $gte: now },
      _id: { $nin: Array.from(registeredGymIds) } // Exclude already registered gym sessions
    }).sort({ date: 1 }).limit(40);

    // Score each event based on recommendation rules
    const scoredEvents = upcomingEvents.map(event => {
      let score = 0;
      const reasons = [];

      // Rule 1: Faculty match (highest priority for workshops)
      if (event.type === 'Workshop' && event.workshop?.faculty_responsible) {
        if (user.faculty && event.workshop.faculty_responsible.toLowerCase().includes(user.faculty.toLowerCase())) {
          score += 10;
          reasons.push(`From your faculty (${user.faculty})`);
        }
      }

      // Rule 2: Event type preference (based on registrations)
      if (registeredEventTypes.has(event.type)) {
        score += 8;
        reasons.push(`You've attended ${event.type}s before`);
      }

      // Rule 3: Event type preference (based on favorites)
      if (favoritedEventTypes.has(event.type)) {
        score += 7;
        reasons.push(`Similar to your favorites`);
      }

      // Rule 4: Free events (remove barriers)
      const isFree = (event.type === 'Workshop' && (!event.workshop?.price || event.workshop.price === 0)) ||
                     (event.type === 'Trip' && (!event.trip?.price || event.trip.price === 0)) ||
                     (event.type === 'Conference') ||
                     (event.type === 'Bazaar') ||
                     (event.type === 'Booth');
      
      if (isFree) {
        score += 5;
        reasons.push('Free to attend');
      }

      // Rule 5: Starting soon (within 2 weeks)
      const daysUntilStart = Math.floor((new Date(event.start_date) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilStart <= 14) {
        score += 6;
        reasons.push('Starting soon');
      }

      // Rule 6: Available spots (for workshops/trips)
      if (event.type === 'Workshop' && event.workshop?.capacity) {
        const registrationCount = event.current_registrations || 0;
        const availableSpots = event.workshop.capacity - registrationCount;
        
        if (availableSpots > 0 && availableSpots <= 10) {
          score += 4;
          reasons.push('Limited spots available');
        } else if (availableSpots > 10) {
          score += 2;
          reasons.push('Spots available');
        }
      }

      if (event.type === 'Trip' && event.trip?.capacity) {
        const registrationCount = event.current_registrations || 0;
        const availableSpots = event.trip.capacity - registrationCount;
        
        if (availableSpots > 0 && availableSpots <= 10) {
          score += 4;
          reasons.push('Limited spots available');
        } else if (availableSpots > 10) {
          score += 2;
          reasons.push('Spots available');
        }
      }

      // Rule 7: Popular events (highly rated)
      if (event.average_rating >= 4.5 && event.total_ratings >= 5) {
        score += 3;
        reasons.push('Highly rated');
      }

      return {
        item: event.toObject(),
        item_type: 'event',
        score,
        reasons: reasons.slice(0, 2)
      };
    });

    // Score gym sessions
    const scoredGymSessions = upcomingGymSessions.map(gymSession => {
      let score = 0;
      const reasons = [];

      // Rule 1: Gym type preference (attended before)
      if (registeredGymTypes.has(gymSession.type)) {
        score += 9;
        reasons.push(`You've attended ${gymSession.type} before`);
      }

      // Rule 2: User has gym history
      if (hasGymHistory) {
        score += 6;
        reasons.push('Based on your gym activity');
      }

      // Rule 3: Free (gym sessions are always free)
      score += 5;
      reasons.push('Free gym session');

      // Rule 4: Happening soon (within 7 days)
      const daysUntilSession = Math.floor((new Date(gymSession.date) - now) / (1000 * 60 * 60 * 24));
      if (daysUntilSession <= 7) {
        score += 5;
        reasons.push('Happening soon');
      }

      // Rule 5: Available spots
      const currentRegistrations = 0; // Would need to aggregate from GymSessionRegistration
      const availableSpots = gymSession.maxParticipants - currentRegistrations;
      if (availableSpots > 0 && availableSpots <= 5) {
        score += 4;
        reasons.push('Limited spots left');
      } else if (availableSpots > 5) {
        score += 2;
        reasons.push('Spots available');
      }

      return {
        item: gymSession.toObject(),
        item_type: 'gym',
        score,
        reasons: reasons.slice(0, 2)
      };
    });

    // Combine and sort by score
    let allRecommendations = [...scoredEvents, ...scoredGymSessions]
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => ({
        ...item.item,
        item_type: item.item_type,
        recommendation_score: item.score,
        recommendation_reasons: item.reasons
      }));

    // If no personalized recommendations (no history), show random events
    if (allRecommendations.length === 0) {
      const hasHistory = userRegistrations.length > 0 || userGymRegistrations.length > 0 || userFavorites.length > 0;
      
      if (!hasHistory) {
        // User has no history - show random popular events
        const randomEvents = [...upcomingEvents, ...upcomingGymSessions]
          .sort(() => Math.random() - 0.5) // Random shuffle
          .slice(0, 6)
          .map(item => {
            const isGym = item.date !== undefined; // Gym sessions have 'date', events have 'start_date'
            return {
              ...(isGym ? item.toObject() : item.toObject()),
              item_type: isGym ? 'gym' : 'event',
              recommendation_score: 0,
              recommendation_reasons: ['New events for you to explore']
            };
          });
        
        allRecommendations = randomEvents;
      }
    }

    res.json({
      recommendations: allRecommendations,
      user_profile: {
        faculty: user.faculty,
        preferred_event_types: Array.from(new Set([...registeredEventTypes, ...favoritedEventTypes])),
        preferred_gym_types: Array.from(registeredGymTypes),
        registration_count: userRegistrations.length,
        gym_registration_count: userGymRegistrations.length,
        favorites_count: userFavorites.length
      }
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      message: "Server error", 
      error: error.message 
    });
  }
};
