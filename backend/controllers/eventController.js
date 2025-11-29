import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import VendorApplication from "../models/VendorApplication.js";
import Comment from "../models/Comment.js";
import Rating from "../models/Rating.js";

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

/* -------------------------- POST /events/:eventId/rate -------------------------- */
export const rateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { rating, review } = req.body;
    const userId = req.user._id;

    // Validate rating value
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ 
        message: "Rating must be between 1 and 5" 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event has ended (only completed events can be rated)
    if (event.status !== "completed" && event.end_date > new Date()) {
      return res.status(400).json({ 
        message: "You can only rate events that have been completed" 
      });
    }

    // Check if user attended the event
    const registration = await Registration.findOne({
      event_id: eventId,
      user_id: userId,
      status: "registered",
      payment_status: { $in: ["paid", "free"] }
    });

    if (!registration) {
      return res.status(403).json({ 
        message: "You can only rate events you have attended" 
      });
    }

    // Check if user has already rated this event
    let existingRating = await Rating.findOne({
      event_id: eventId,
      user_id: userId
    });

    if (existingRating) {
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.review = review || existingRating.review;
      await existingRating.save();

      // Recalculate average rating
      const allRatings = await Rating.find({ event_id: eventId });
      const totalRatings = allRatings.length;
      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

      event.average_rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      event.total_ratings = totalRatings;
      await event.save();

      return res.status(200).json({
        message: "Rating updated successfully",
        rating: existingRating,
        event: {
          id: event._id,
          name: event.name,
          average_rating: event.average_rating,
          total_ratings: event.total_ratings
        }
      });
    }

    // Create new rating
    const newRating = new Rating({
      event_id: eventId,
      user_id: userId,
      rating,
      review: review || ""
    });

    await newRating.save();

    // Update event average rating and total ratings
    const allRatings = await Rating.find({ event_id: eventId });
    const totalRatings = allRatings.length;
    const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    event.average_rating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
    event.total_ratings = totalRatings;
    await event.save();

    res.status(201).json({
      message: "Rating submitted successfully",
      rating: newRating,
      event: {
        id: event._id,
        name: event.name,
        average_rating: event.average_rating,
        total_ratings: event.total_ratings
      }
    });
  } catch (err) {
    console.error('Error rating event:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- GET /events/:eventId/ratings -------------------------- */
export const getEventRatings = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all ratings for the event with user details
    const ratings = await Rating.find({ event_id: eventId })
      .populate('user_id', 'first_name last_name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      event: {
        id: event._id,
        name: event.name,
        average_rating: event.average_rating,
        total_ratings: event.total_ratings
      },
      ratings
    });
  } catch (err) {
    console.error('Error fetching ratings:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- GET /events/:eventId/my-rating -------------------------- */
export const getMyRating = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get user's rating for this event
    const rating = await Rating.findOne({
      event_id: eventId,
      user_id: userId
    }).populate('user_id', 'first_name last_name email');

    if (!rating) {
      return res.status(404).json({ 
        message: "You have not rated this event yet",
        canRate: false
      });
    }

    res.status(200).json({
      rating,
      event: {
        id: event._id,
        name: event.name,
        average_rating: event.average_rating,
        total_ratings: event.total_ratings
      }
    });
  } catch (err) {
    console.error('Error fetching user rating:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- DELETE /events/:eventId/rate -------------------------- */
export const deleteRating = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find and delete the rating
    const rating = await Rating.findOneAndDelete({
      event_id: eventId,
      user_id: userId
    });

    if (!rating) {
      return res.status(404).json({ 
        message: "Rating not found" 
      });
    }

    // Recalculate event average rating
    const allRatings = await Rating.find({ event_id: eventId });
    const totalRatings = allRatings.length;
    
    if (totalRatings > 0) {
      const averageRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;
      event.average_rating = Math.round(averageRating * 10) / 10;
    } else {
      event.average_rating = 0;
    }
    
    event.total_ratings = totalRatings;
    await event.save();

    res.status(200).json({
      message: "Rating deleted successfully",
      event: {
        id: event._id,
        name: event.name,
        average_rating: event.average_rating,
        total_ratings: event.total_ratings
      }
    });
  } catch (err) {
    console.error('Error deleting rating:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- POST /events/:eventId/comments -------------------------- */
export const createComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { body } = req.body;
    const userId = req.user._id;

    // Validate comment body
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ 
        message: "Comment body is required" 
      });
    }

    if (body.length > 1000) {
      return res.status(400).json({ 
        message: "Comment cannot exceed 1000 characters" 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if user attended the event
    const registration = await Registration.findOne({
      event_id: eventId,
      user_id: userId,
      status: "registered",
      payment_status: { $in: ["paid", "free"] }
    });

    if (!registration) {
      return res.status(403).json({ 
        message: "You can only comment on events you have attended" 
      });
    }

    // Create new comment
    const newComment = new Comment({
      event_id: eventId,
      author_id: userId,
      body: body.trim()
    });

    await newComment.save();

    // Populate author details before sending response
    await newComment.populate('author_id', 'first_name last_name email');

    res.status(201).json({
      message: "Comment created successfully",
      comment: newComment
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- PUT /events/:eventId/comments/:commentId -------------------------- */
export const updateComment = async (req, res) => {
  try {
    const { eventId, commentId } = req.params;
    const { body } = req.body;
    const userId = req.user._id;

    // Validate comment body
    if (!body || body.trim().length === 0) {
      return res.status(400).json({ 
        message: "Comment body is required" 
      });
    }

    if (body.length > 1000) {
      return res.status(400).json({ 
        message: "Comment cannot exceed 1000 characters" 
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find the comment
    const comment = await Comment.findOne({
      _id: commentId,
      event_id: eventId
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author of the comment
    if (comment.author_id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "You can only edit your own comments" 
      });
    }

    // Check if comment is not deleted
    if (comment.status === "deleted") {
      return res.status(400).json({ 
        message: "Cannot edit a deleted comment" 
      });
    }

    // Update the comment
    comment.body = body.trim();
    await comment.save();

    // Populate author details before sending response
    await comment.populate('author_id', 'first_name last_name email');

    res.status(200).json({
      message: "Comment updated successfully",
      comment
    });
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- DELETE /events/:eventId/comments/:commentId -------------------------- */
export const deleteUserComment = async (req, res) => {
  try {
    const { eventId, commentId } = req.params;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Find the comment
    const comment = await Comment.findOne({
      _id: commentId,
      event_id: eventId
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Check if user is the author of the comment
    if (comment.author_id.toString() !== userId.toString()) {
      return res.status(403).json({ 
        message: "You can only delete your own comments" 
      });
    }

    // Check if comment is already deleted
    if (comment.status === "deleted") {
      return res.status(400).json({ 
        message: "Comment is already deleted" 
      });
    }

    // Mark comment as deleted
    comment.status = "deleted";
    comment.deleted_by = userId;
    await comment.save();

    res.status(200).json({
      message: "Comment deleted successfully",
      comment: {
        id: comment._id,
        event_id: comment.event_id,
        deleted_at: new Date()
      }
    });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: err.message });
  }
};

/* -------------------------- GET /events/:eventId/my-comment -------------------------- */
export const getMyComment = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get user's comment for this event
    const comment = await Comment.findOne({
      event_id: eventId,
      author_id: userId,
      status: "visible"
    }).populate('author_id', 'first_name last_name email');

    if (!comment) {
      return res.status(404).json({ 
        message: "You have not commented on this event yet"
      });
    }

    res.status(200).json({
      comment
    });
  } catch (err) {
    console.error('Error fetching user comment:', err);
    res.status(500).json({ message: err.message });
  }
};
