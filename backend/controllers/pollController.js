import Poll from "../models/Poll.js";
import PollApplication from "../models/PollApplication.js";
import Vote from "../models/Vote.js";
import User from "../models/User.js";

// ========================================
// EVENTS OFFICE ROUTES
// ========================================

// Create a new poll
export const createPoll = async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      application_deadline,
      max_vendors,
      available_positions
    } = req.body;

    // Validate required fields
    if (!title || !description || !start_date || !end_date || !application_deadline) {
      return res.status(400).json({
        message: "Title, description, start date, end date, and application deadline are required"
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const deadline = new Date(application_deadline);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(deadline.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }

    if (deadline > startDate) {
      return res.status(400).json({ message: "Application deadline must be before or on the start date" });
    }

    // Validate available positions
    if (!available_positions || !Array.isArray(available_positions) || available_positions.length === 0) {
      return res.status(400).json({ message: "At least one available position must be specified" });
    }

    // Validate position format
    for (const pos of available_positions) {
      if (!pos.wall || !pos.slot) {
        return res.status(400).json({ message: "Each position must have wall and slot" });
      }
      if (!['north', 'south', 'east', 'west'].includes(pos.wall)) {
        return res.status(400).json({ message: "Wall must be north, south, east, or west" });
      }
      if (pos.slot < 1 || pos.slot > 6) {
        return res.status(400).json({ message: "Slot must be between 1 and 6" });
      }
    }

    // Create poll
    const poll = new Poll({
      title,
      description,
      created_by: req.user._id,
      start_date: startDate,
      end_date: endDate,
      application_deadline: deadline,
      max_vendors: max_vendors || 1,
      available_positions,
      status: 'draft'
    });

    await poll.save();
    await poll.populate('created_by', 'first_name last_name email role');

    res.status(201).json({
      message: "Poll created successfully",
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        start_date: poll.start_date,
        end_date: poll.end_date,
        application_deadline: poll.application_deadline,
        max_vendors: poll.max_vendors,
        available_positions: poll.available_positions,
        status: poll.status,
        created_by: {
          name: `${poll.created_by.first_name} ${poll.created_by.last_name}`,
          email: poll.created_by.email
        },
        created_at: poll.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating poll:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get all polls (Events Office)
export const getAllPolls = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status && ['draft', 'open', 'closed', 'completed', 'cancelled'].includes(status)) {
      filter.status = status;
    }

    const polls = await Poll.find(filter)
      .populate('created_by', 'first_name last_name email role')
      .populate('cancelled_by', 'first_name last_name email')
      .sort({ createdAt: -1 });

    // Get application counts for each poll
    const pollsWithCounts = await Promise.all(
      polls.map(async (poll) => {
        const applicationCount = await PollApplication.countDocuments({ poll_id: poll._id });
        const selectedCount = poll.selected_vendors?.length || 0;
        
        return {
          _id: poll._id,
          title: poll.title,
          description: poll.description,
          start_date: poll.start_date,
          end_date: poll.end_date,
          application_deadline: poll.application_deadline,
          max_vendors: poll.max_vendors,
          available_positions: poll.available_positions,
          status: poll.status,
          application_count: applicationCount,
          selected_count: selectedCount,
          created_by: {
            name: `${poll.created_by.first_name} ${poll.created_by.last_name}`,
            email: poll.created_by.email
          },
          closed_at: poll.closed_at,
          cancelled_at: poll.cancelled_at,
          created_at: poll.createdAt,
          updated_at: poll.updatedAt
        };
      })
    );

    res.json({
      success: true,
      message: "Polls retrieved successfully",
      count: pollsWithCounts.length,
      polls: pollsWithCounts
    });
  } catch (error) {
    console.error('Error fetching polls:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get poll by ID (Events Office)
export const getPollById = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId)
      .populate('created_by', 'first_name last_name email role')
      .populate('cancelled_by', 'first_name last_name email')
      .populate('selected_vendors.vendor_user_id', 'first_name last_name email vendor_info')
      .populate('selected_vendors.selected_by', 'first_name last_name email');

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Get all applications for this poll
    const applications = await PollApplication.find({ poll_id: pollId })
      .populate('vendor_user_id', 'first_name last_name email vendor_info')
      .populate('reviewed_by', 'first_name last_name email')
      .sort({ applied_at: -1 });

    res.json({
      success: true,
      message: "Poll retrieved successfully",
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        start_date: poll.start_date,
        end_date: poll.end_date,
        application_deadline: poll.application_deadline,
        max_vendors: poll.max_vendors,
        available_positions: poll.available_positions,
        status: poll.status,
        selected_vendors: poll.selected_vendors,
        created_by: {
          name: `${poll.created_by.first_name} ${poll.created_by.last_name}`,
          email: poll.created_by.email
        },
        closed_at: poll.closed_at,
        cancelled_at: poll.cancelled_at,
        cancellation_reason: poll.cancellation_reason,
        created_at: poll.createdAt,
        updated_at: poll.updatedAt
      },
      applications: applications.map(app => ({
        _id: app._id,
        vendor: {
          _id: app.vendor_user_id._id,
          name: app.vendor_user_id.vendor_info?.company_name || 
                `${app.vendor_user_id.first_name} ${app.vendor_user_id.last_name}`,
          email: app.vendor_user_id.email
        },
        business_name: app.business_name,
        business_type: app.business_type,
        business_description: app.business_description,
        products_offered: app.products_offered,
        contact_phone: app.contact_phone,
        contact_email: app.contact_email,
        staff: app.staff,
        preferred_booth_size: app.preferred_booth_size,
        preferred_positions: app.preferred_positions,
        notes: app.notes,
        status: app.status,
        applied_at: app.applied_at,
        reviewed_at: app.reviewed_at,
        rejection_reason: app.rejection_reason
      }))
    });
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update poll (Events Office)
export const updatePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const updates = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    // Don't allow updates if poll is closed or cancelled
    if (poll.status === 'closed' || poll.status === 'completed' || poll.status === 'cancelled') {
      return res.status(400).json({ 
        message: `Cannot update poll with status: ${poll.status}` 
      });
    }

    // Validate dates if provided
    if (updates.start_date || updates.end_date || updates.application_deadline) {
      const startDate = updates.start_date ? new Date(updates.start_date) : poll.start_date;
      const endDate = updates.end_date ? new Date(updates.end_date) : poll.end_date;
      const deadline = updates.application_deadline ? new Date(updates.application_deadline) : poll.application_deadline;

      if (endDate <= startDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }
      if (deadline > startDate) {
        return res.status(400).json({ message: "Application deadline must be before or on the start date" });
      }
    }

    // Update poll
    Object.keys(updates).forEach(key => {
      if (['title', 'description', 'start_date', 'end_date', 'application_deadline', 'max_vendors', 'available_positions'].includes(key)) {
        poll[key] = updates[key];
      }
    });

    await poll.save();

    res.json({
      message: "Poll updated successfully",
      poll: {
        _id: poll._id,
        title: poll.title,
        description: poll.description,
        start_date: poll.start_date,
        end_date: poll.end_date,
        application_deadline: poll.application_deadline,
        max_vendors: poll.max_vendors,
        available_positions: poll.available_positions,
        status: poll.status
      }
    });
  } catch (error) {
    console.error('Error updating poll:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// Open poll (make it available for vendor applications)
export const openPoll = async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'draft') {
      return res.status(400).json({ 
        message: `Cannot open poll with status: ${poll.status}. Only draft polls can be opened.` 
      });
    }

    await poll.open();

    res.json({
      message: "Poll opened successfully. Vendors can now apply.",
      poll: {
        _id: poll._id,
        title: poll.title,
        status: poll.status
      }
    });
  } catch (error) {
    console.error('Error opening poll:', error);
    res.status(500).json({ message: error.message });
  }
};

// Close poll and select vendors
export const closePoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { selected_vendors } = req.body; // Array of { application_id, assigned_position }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'open') {
      return res.status(400).json({ 
        message: `Cannot close poll with status: ${poll.status}. Only open polls can be closed.` 
      });
    }

    // Validate selected vendors
    if (!selected_vendors || !Array.isArray(selected_vendors)) {
      return res.status(400).json({ message: "selected_vendors must be an array" });
    }

    if (selected_vendors.length > poll.max_vendors) {
      return res.status(400).json({ 
        message: `Cannot select more than ${poll.max_vendors} vendor(s)` 
      });
    }

    // Build selected vendors array
    const selectedVendorsData = await Promise.all(
      selected_vendors.map(async ({ application_id, assigned_position }) => {
        const application = await PollApplication.findById(application_id)
          .populate('vendor_user_id');
        
        if (!application) {
          throw new Error(`Application ${application_id} not found`);
        }

        if (application.poll_id.toString() !== pollId) {
          throw new Error(`Application does not belong to this poll`);
        }

        // Update application status
        application.status = 'selected';
        application.reviewed_at = new Date();
        application.reviewed_by = req.user._id;
        await application.save();

        return {
          vendor_application_id: application._id,
          vendor_user_id: application.vendor_user_id._id,
          assigned_position: assigned_position,
          selected_at: new Date(),
          selected_by: req.user._id
        };
      })
    );

    // Mark rejected applications
    const allApplications = await PollApplication.find({ 
      poll_id: pollId,
      status: 'pending'
    });
    
    const selectedIds = selected_vendors.map(sv => sv.application_id.toString());
    for (const app of allApplications) {
      if (!selectedIds.includes(app._id.toString())) {
        app.status = 'rejected';
        app.reviewed_at = new Date();
        app.reviewed_by = req.user._id;
        await app.save();
      }
    }

    // Close poll
    await poll.close(selectedVendorsData);

    res.json({
      message: "Poll closed successfully. Vendors have been selected.",
      poll: {
        _id: poll._id,
        title: poll.title,
        status: poll.status,
        selected_vendors: poll.selected_vendors,
        closed_at: poll.closed_at
      }
    });
  } catch (error) {
    console.error('Error closing poll:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel poll
export const cancelPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const { cancellation_reason } = req.body;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status === 'closed' || poll.status === 'completed') {
      return res.status(400).json({ 
        message: `Cannot cancel poll with status: ${poll.status}` 
      });
    }

    await poll.cancel(req.user._id, cancellation_reason);

    res.json({
      message: "Poll cancelled successfully",
      poll: {
        _id: poll._id,
        title: poll.title,
        status: poll.status,
        cancelled_at: poll.cancelled_at,
        cancellation_reason: poll.cancellation_reason
      }
    });
  } catch (error) {
    console.error('Error cancelling poll:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// VENDOR ROUTES
// ========================================

// Get all open polls (for vendors to view and apply)
export const getOpenPolls = async (req, res) => {
  try {
    const polls = await Poll.find({
      status: 'open',
      application_deadline: { $gte: new Date() } // Only polls with deadline not passed
    })
    .populate('created_by', 'first_name last_name email role')
    .sort({ application_deadline: 1 }); // Sort by deadline (earliest first)

    // Check which polls the vendor has already applied to
    const vendorApplications = await PollApplication.find({
      vendor_user_id: req.user._id
    }).select('poll_id');

    const appliedPollIds = new Set(vendorApplications.map(app => app.poll_id.toString()));

    const pollsWithApplicationStatus = polls.map(poll => ({
      _id: poll._id,
      title: poll.title,
      description: poll.description,
      start_date: poll.start_date,
      end_date: poll.end_date,
      application_deadline: poll.application_deadline,
      max_vendors: poll.max_vendors,
      available_positions: poll.available_positions,
      has_applied: appliedPollIds.has(poll._id.toString()),
      created_at: poll.createdAt
    }));

    res.json({
      success: true,
      message: "Open polls retrieved successfully",
      count: pollsWithApplicationStatus.length,
      polls: pollsWithApplicationStatus
    });
  } catch (error) {
    console.error('Error fetching open polls:', error);
    res.status(500).json({ message: error.message });
  }
};

// Apply to poll (vendor)
export const applyToPoll = async (req, res) => {
  try {
    const { pollId } = req.params;
    const {
      business_name,
      business_type,
      business_description,
      products_offered,
      contact_phone,
      contact_email,
      staff,
      preferred_booth_size,
      preferred_positions,
      notes
    } = req.body;

    // Validate required fields
    if (!business_name || !business_description || !products_offered || 
        !contact_phone || !contact_email || !preferred_booth_size) {
      return res.status(400).json({
        message: "Business name, description, products offered, contact info, and preferred booth size are required"
      });
    }

    // Check if poll exists and is open
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'open') {
      return res.status(400).json({ 
        message: `Cannot apply to poll with status: ${poll.status}. Only open polls accept applications.` 
      });
    }

    // Check if application deadline has passed
    if (new Date() > poll.application_deadline) {
      return res.status(400).json({ 
        message: "Application deadline has passed" 
      });
    }

    // Check if vendor already applied
    const existingApplication = await PollApplication.findOne({
      poll_id: pollId,
      vendor_user_id: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ 
        message: "You have already applied to this poll",
        application: {
          _id: existingApplication._id,
          status: existingApplication.status,
          applied_at: existingApplication.applied_at
        }
      });
    }

    // Validate staff (max 5)
    if (staff && staff.length > 5) {
      return res.status(400).json({ message: "Maximum 5 staff members allowed" });
    }

    // Validate preferred booth size
    if (!['2x2', '4x4'].includes(preferred_booth_size)) {
      return res.status(400).json({ message: "Preferred booth size must be 2x2 or 4x4" });
    }

    // Create application
    const application = new PollApplication({
      poll_id: pollId,
      vendor_user_id: req.user._id,
      business_name,
      business_type,
      business_description,
      products_offered,
      contact_phone,
      contact_email,
      staff: staff || [],
      preferred_booth_size,
      preferred_positions: preferred_positions || [],
      notes,
      status: 'pending'
    });

    await application.save();
    await application.populate('vendor_user_id', 'first_name last_name email vendor_info');

    res.status(201).json({
      message: "Application submitted successfully",
      application: {
        _id: application._id,
        poll_id: application.poll_id,
        business_name: application.business_name,
        preferred_booth_size: application.preferred_booth_size,
        status: application.status,
        applied_at: application.applied_at
      }
    });
  } catch (error) {
    console.error('Error applying to poll:', error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You have already applied to this poll" 
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get vendor's poll applications
export const getMyPollApplications = async (req, res) => {
  try {
    const applications = await PollApplication.find({
      vendor_user_id: req.user._id
    })
    .populate('poll_id', 'title description start_date end_date application_deadline status available_positions max_vendors')
    .populate('reviewed_by', 'first_name last_name email')
    .sort({ applied_at: -1 });

    res.json({
      success: true,
      message: "Poll applications retrieved successfully",
      count: applications.length,
      applications: applications.map(app => ({
        _id: app._id,
        poll: {
          _id: app.poll_id._id,
          title: app.poll_id.title,
          description: app.poll_id.description,
          start_date: app.poll_id.start_date,
          end_date: app.poll_id.end_date,
          application_deadline: app.poll_id.application_deadline,
          status: app.poll_id.status,
          available_positions: app.poll_id.available_positions,
          max_vendors: app.poll_id.max_vendors
        },
        business_name: app.business_name,
        business_type: app.business_type,
        preferred_booth_size: app.preferred_booth_size,
        preferred_positions: app.preferred_positions,
        status: app.status,
        applied_at: app.applied_at,
        reviewed_at: app.reviewed_at,
        rejection_reason: app.rejection_reason
      }))
    });
  } catch (error) {
    console.error('Error fetching poll applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// ========================================
// VOTING ROUTES (For Students, Staff, TA, Professor)
// ========================================

// Get open polls with applications for voting
export const getPollsForVoting = async (req, res) => {
  try {
    const polls = await Poll.find({
      status: 'open',
      application_deadline: { $gte: new Date() } // Only polls with deadline not passed
    })
    .populate('created_by', 'first_name last_name email role')
    .sort({ application_deadline: 1 });

    // Get applications and vote counts for each poll
    const pollsWithVotes = await Promise.all(
      polls.map(async (poll) => {
        const applications = await PollApplication.find({
          poll_id: poll._id,
          status: 'pending'
        })
        .populate('vendor_user_id', 'first_name last_name email vendor_info');

        // Get vote counts for each application
        const applicationsWithVotes = await Promise.all(
          applications.map(async (app) => {
            const voteCount = await Vote.countDocuments({ application_id: app._id });
            const userVote = await Vote.findOne({
              poll_id: poll._id,
              application_id: app._id,
              voter_id: req.user._id
            });

            return {
              _id: app._id,
              vendor: {
                _id: app.vendor_user_id._id,
                name: app.vendor_user_id.vendor_info?.company_name || 
                      `${app.vendor_user_id.first_name} ${app.vendor_user_id.last_name}`,
                email: app.vendor_user_id.email
              },
              business_name: app.business_name,
              business_type: app.business_type,
              business_description: app.business_description,
              products_offered: app.products_offered,
              preferred_booth_size: app.preferred_booth_size,
              vote_count: voteCount,
              has_voted: !!userVote
            };
          })
        );

        return {
          _id: poll._id,
          title: poll.title,
          description: poll.description,
          start_date: poll.start_date,
          end_date: poll.end_date,
          application_deadline: poll.application_deadline,
          max_vendors: poll.max_vendors,
          available_positions: poll.available_positions,
          applications: applicationsWithVotes,
          total_applications: applicationsWithVotes.length,
          created_at: poll.createdAt
        };
      })
    );

    res.json({
      success: true,
      message: "Polls for voting retrieved successfully",
      count: pollsWithVotes.length,
      polls: pollsWithVotes
    });
  } catch (error) {
    console.error('Error fetching polls for voting:', error);
    res.status(500).json({ message: error.message });
  }
};

// Vote for a vendor application
export const voteForApplication = async (req, res) => {
  try {
    const { pollId, applicationId } = req.params;

    // Check if poll exists and is open
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'open') {
      return res.status(400).json({ 
        message: `Cannot vote on poll with status: ${poll.status}. Only open polls accept votes.` 
      });
    }

    // Check if application deadline has passed
    if (new Date() > poll.application_deadline) {
      return res.status(400).json({ 
        message: "Voting deadline has passed" 
      });
    }

    // Check if application exists and belongs to this poll
    const application = await PollApplication.findOne({
      _id: applicationId,
      poll_id: pollId,
      status: 'pending'
    });

    if (!application) {
      return res.status(404).json({ 
        message: "Application not found or not eligible for voting" 
      });
    }

    // Check if user already voted for this application
    const existingVote = await Vote.findOne({
      poll_id: pollId,
      application_id: applicationId,
      voter_id: req.user._id
    });

    if (existingVote) {
      return res.status(400).json({ 
        message: "You have already voted for this vendor application" 
      });
    }

    // Create vote
    const vote = new Vote({
      poll_id: pollId,
      application_id: applicationId,
      voter_id: req.user._id
    });

    await vote.save();

    // Get updated vote count
    const voteCount = await Vote.countDocuments({ application_id: applicationId });

    res.json({
      message: "Vote submitted successfully",
      vote: {
        _id: vote._id,
        poll_id: vote.poll_id,
        application_id: vote.application_id,
        voted_at: vote.voted_at
      },
      vote_count: voteCount
    });
  } catch (error) {
    console.error('Error voting for application:', error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "You have already voted for this vendor application" 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Remove vote (unvote)
export const removeVote = async (req, res) => {
  try {
    const { pollId, applicationId } = req.params;

    // Check if poll exists and is open
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.status !== 'open') {
      return res.status(400).json({ 
        message: `Cannot remove vote from poll with status: ${poll.status}` 
      });
    }

    // Find and delete vote
    const vote = await Vote.findOneAndDelete({
      poll_id: pollId,
      application_id: applicationId,
      voter_id: req.user._id
    });

    if (!vote) {
      return res.status(404).json({ 
        message: "Vote not found" 
      });
    }

    // Get updated vote count
    const voteCount = await Vote.countDocuments({ application_id: applicationId });

    res.json({
      message: "Vote removed successfully",
      vote_count: voteCount
    });
  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user's votes for a poll
export const getMyVotes = async (req, res) => {
  try {
    const { pollId } = req.params;

    const votes = await Vote.find({
      poll_id: pollId,
      voter_id: req.user._id
    }).select('application_id voted_at');

    res.json({
      success: true,
      message: "User votes retrieved successfully",
      votes: votes.map(v => ({
        application_id: v.application_id.toString(),
        voted_at: v.voted_at
      }))
    });
  } catch (error) {
    console.error('Error fetching user votes:', error);
    res.status(500).json({ message: error.message });
  }
};

