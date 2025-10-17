import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import VendorApplication from "../models/VendorApplication.js";
import Comment from "../models/Comment.js";

/* -------------------------- GET /events/upcoming -------------------------- */
export const getUpcomingEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "upcoming",
      start_date: { $gt: new Date() },
    }).sort({ start_date: 1 });

    // For bazaar events, fetch approved vendors
    const eventsWithVendors = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject();
        
        // If it's a bazaar, fetch approved vendors
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
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- GET /events/filter/:field/:value -------------------------- */
export const filterEvents = async (req, res) => {
  try {
    const { field, value } = req.params;
    const regex = new RegExp(value, "i");

    let filter = {};

    switch (field.toLowerCase()) {
      case "name":
        filter.name = regex;
        break;
      case "type":
        filter.type = value;
        break;
      case "professor":
        filter.$or = [
          { "workshop.professors_participating": regex },
          { "conference.professors_participating": regex },
        ];
        break;
      case "location":
        filter.location = regex;
        break;
      default:
        return res.status(400).json({ error: "Invalid filter field" });
    }

    const events = await Event.find(filter).sort({ start_date: 1 });
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- GET /events/sort/date/:order -------------------------- */
export const sortEventsByDate = async (req, res) => {
  try {
    const { order } = req.params;
    const sortOrder = order === "desc" ? -1 : 1;

    const events = await Event.find().sort({ start_date: sortOrder });
    res.status(200).json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    const eventToDelete = await Event.findById(eventId);
    
    if (!eventToDelete) {
      return res.status(404).json({ message: "Event not found" });
    }

    const registered = await Registration.countDocuments({ 
      event_id: eventId,
      status: "registered" 
    });

    if (registered > 0) {
      return res.status(400).json({
        message: "Cannot delete event as there are registered users",
        registrations: registered
      });
    }

    await Registration.deleteMany({ event_id: eventId });
    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      message: "Event deleted successfully",
      deletedEvent: eventToDelete
    });

  } catch (err) {
    console.error('Error deleting event:', err);
    res.status(500).json({ message: err.message });
  }
};

// /* -------------------------- GET /events/:id -------------------------- */
// export const getEventById = async (req, res) => {
//   try {
//     const event = await Event.findById(req.params.id);
//     if (!event) return res.status(404).json({ error: "Event not found" });
//     res.json(event);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server error" });
//   }
// };

export const getEventComments = async (req, res) => {
  try {
    const { event_id } = req.params;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Fetch comments with user details populated
    const comments = await Comment.find({ event_id })
      .populate('user_id', 'name email') // populate user info
      .sort({ createdAt: -1 }); // newest first

    // Calculate average rating
    const ratings = comments.filter(c => c.rating != null).map(c => c.rating);
    const averageRating = ratings.length > 0 
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
      : null;

    res.status(200).json({
      comments,
      totalComments: comments.length,
      averageRating,
      totalRatings: ratings.length
    });
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: err.message });
  }
};

// | Purpose                    | Method | Example URL                                              |
// | -------------------------- | ------ | -------------------------------------------------------- |
// | 🔹 Get upcoming events     | `GET`  | `http://localhost:5001/events/upcoming`                  |
// | 🔹 Filter by name          | `GET`  | `http://localhost:5001/events/filter/name/lightFestival` |
// | 🔹 Filter by type          | `GET`  | `http://localhost:5001/events/filter/type/Trip`          |
// | 🔹 Filter by professor     | `GET`  | `http://localhost:5001/events/filter/professor/Ahmed`    |
// | 🔹 Filter by location      | `GET`  | `http://localhost:5001/events/filter/location/Cairo`     |
// | 🔹 Sort by date ascending  | `GET`  | `http://localhost:5001/events/sort/date/asc`             |
// | 🔹 Sort by date descending | `GET`  | `http://localhost:5001/events/sort/date/desc`            |
// | 🔹 Get event by ID         | `GET`  | `http://localhost:5001/events/652ad81e23f3c9b96a8120b4`  |
