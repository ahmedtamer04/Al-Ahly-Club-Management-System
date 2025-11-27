import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import VendorApplication from "../models/VendorApplication.js";
import Comment from "../models/Comment.js";

// Helper function to check if user role is allowed for an event
const isRoleAllowed = (event, userRole) => {
  // If no restrictions (empty array), all roles can access
  if (!event.allowed_roles || event.allowed_roles.length === 0) {
    return true;
  }
  // Check if user's role is in the allowed list
  return event.allowed_roles.includes(userRole);
};

// Helper function to filter events by role restrictions
const filterEventsByRole = (events, userRole) => {
  return events.filter(event => isRoleAllowed(event, userRole));
};

/* -------------------------- GET /events/upcoming -------------------------- */
export const getUpcomingEvents = async (req, res) => {
  try {
    const userRole = req.user?.role;
    let events = await Event.find({
      status: "upcoming",
      start_date: { $gt: new Date() },
      // Exclude workshops that are not accepted (pending/rejected/revision_requested)
      $or: [
        { type: { $ne: "Workshop" } }, // Include all non-workshop events
        { type: "Workshop", "workshop.approval_status": "accepted" } // Only include accepted workshops
      ]
    })
    .populate('bazaar.vendors_participating.vendor_id', 'first_name last_name email vendor_info')
    .populate('booth.vendors.vendor_id', 'first_name last_name email vendor_info')
    .sort({ start_date: 1 });
    
    // Filter by role restrictions (unless user is Admin or EventsOffice)
    if (userRole !== 'Admin' && userRole !== 'EventsOffice') {
      events = filterEventsByRole(events, userRole);
    }
    
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

    // Add workshop approval filter
    const workshopFilter = {
      $or: [
        { type: { $ne: "Workshop" } }, // Include all non-workshop events
        { type: "Workshop", "workshop.approval_status": "accepted" } // Only include accepted workshops
      ]
    };

    // Combine the original filter with workshop approval filter
    const finalFilter = {
      $and: [
        filter,
        workshopFilter
      ]
    };

    let events = await Event.find(finalFilter)
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: 1 });
    
    // Filter by role restrictions (unless user is Admin or EventsOffice)
    const userRole = req.user?.role;
    if (userRole !== 'Admin' && userRole !== 'EventsOffice') {
      events = filterEventsByRole(events, userRole);
    }
    
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

    let events = await Event.find({
      // Exclude workshops that are not accepted
      $or: [
        { type: { $ne: "Workshop" } }, // Include all non-workshop events
        { type: "Workshop", "workshop.approval_status": "accepted" } // Only include accepted workshops
      ]
    })
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: sortOrder });
    
    // Filter by role restrictions (unless user is Admin or EventsOffice)
    const userRole = req.user?.role;
    if (userRole !== 'Admin' && userRole !== 'EventsOffice') {
      events = filterEventsByRole(events, userRole);
    }
    
    res.status(200).send(JSON.stringify(events, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

/* -------------------------- GET /events/all -------------------------- */
export const getAllEvents = async (req, res) => {
  try {
    let events = await Event.find({
      // Exclude workshops that are not accepted (pending/rejected/revision_requested)
      $or: [
        { type: { $ne: "Workshop" } }, // Include all non-workshop events
        { type: "Workshop", "workshop.approval_status": "accepted" } // Only include accepted workshops
      ]
    })
      .populate('bazaar.vendors_participating.vendor_id', 'company_name email')
      .populate('booth.vendors.vendor_id', 'company_name email')
      .sort({ start_date: -1 }); // Most recent first
    
    // Note: getAllEvents is for Admin/EventsOffice only, so no role filtering needed
    // But we'll keep it consistent in case permissions change
    
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
    
    const userRole = req.user?.role;
    
    // Check if it's a workshop and if it's not accepted, don't show it to regular users
    // (EventsOffice and Professors should still see it through their dedicated endpoints)
    if (event.type === 'Workshop') {
      const approvalStatus = event.workshop?.approval_status || 'pending';
      if (approvalStatus !== 'accepted') {
        // Check if user is EventsOffice or the professor who created it
        const createdBy = event.created_by?.toString();
        const userId = req.user?._id?.toString();
        
        // Only allow EventsOffice, Admin, or the workshop creator to view non-accepted workshops
        if (userRole !== 'EventsOffice' && userRole !== 'Admin' && createdBy !== userId) {
          return res.status(404).json({ 
            error: "Event not found",
            message: "This workshop is not available"
          });
        }
      }
    }
    
    // Check role restrictions (unless user is Admin or EventsOffice)
    if (userRole !== 'Admin' && userRole !== 'EventsOffice') {
      if (!isRoleAllowed(event, userRole)) {
        return res.status(403).json({ 
          error: "Access denied",
          message: "This event is restricted to specific user roles"
        });
      }
    }
    
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

/* -------------------------- PATCH /events/archive/:eventId -------------------------- */
export const archiveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) return res.status(400).json({ message: 'Event ID is required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Only allow archiving if the event has already ended
    const now = new Date();
    if (event.end_date >= now) {
      return res.status(400).json({ message: 'Event has not finished yet and cannot be archived' });
    }

    if (event.status === 'archived') {
      return res.status(400).json({ message: 'Event is already archived' });
    }

    event.status = 'archived';
    await event.save();

    res.json({ message: 'Event archived successfully', event });
  } catch (err) {
    console.error('Error archiving event:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/* -------------------------- PATCH /events/unarchive/:eventId -------------------------- */
export const unarchiveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;

    if (!eventId) return res.status(400).json({ message: 'Event ID is required' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    if (event.status !== 'archived') {
      return res.status(400).json({ message: 'Event is not archived' });
    }

    // Restore archived events to completed (they are past events)
    event.status = 'completed';
    await event.save();

    res.json({ message: 'Event unarchived successfully', event });
  } catch (err) {
    console.error('Error unarchiving event:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
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
