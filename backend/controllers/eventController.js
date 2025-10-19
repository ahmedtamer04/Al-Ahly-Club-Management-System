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
    })
    .populate('bazaar.vendors_participating.vendor_id', 'first_name last_name email vendor_info')
    .populate('booth.vendors.vendor_id', 'first_name last_name email vendor_info')
    .sort({ start_date: 1 });
    res.status(200).send(JSON.stringify(events, null, 2));
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

    const events = await Event.find(filter)
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: 1 });
    res.status(200).send(JSON.stringify(events, null, 2));
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

    const events = await Event.find()
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: sortOrder });
    res.status(200).send(JSON.stringify(events, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- GET /events/all -------------------------- */
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: -1 }); // Most recent first
    res.status(200).send(JSON.stringify(events, null, 2));
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

/* -------------------------- GET /events/:id -------------------------- */
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

export const getEventComments = async (req, res) => {
  try {
    const { event_id } = req.params;

    if (!event_id) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Fetch comments with user details populated
    const comments = await Comment.find({ event_id, status: { $ne: 'deleted' } })
      .populate('author_id', 'first_name last_name email') // populate author info
      .sort({ createdAt: -1 }); // newest first

    // Also fetch deleted comments for admin visibility
    const deletedComments = await Comment.find({ event_id, status: 'deleted' })
      .populate('author_id', 'first_name last_name email')
      .populate('deleted_by', 'first_name last_name')
      .sort({ createdAt: -1 });

    const allComments = [...comments, ...deletedComments].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      comments: allComments,
      totalComments: allComments.length,
      activeComments: comments.length,
      deletedComments: deletedComments.length
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
