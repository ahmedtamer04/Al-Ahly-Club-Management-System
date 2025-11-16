import Event from "../models/Events.js";
import Registration from "../models/Registration.js";
import Payment from "../models/Payment.js";

/**
 * Get sales report with revenue from all events
 * Supports filtering by event type and date range
 * Supports sorting by revenue
 */
export const getSalesReport = async (req, res) => {
  try {
    const { event_type, start_date, end_date, sort_by = 'revenue', sort_order = 'desc' } = req.query;
    
    // Build base filter for events
    const eventFilter = {};
    if (event_type && event_type !== 'all') {
      eventFilter.type = event_type;
    }
    
    // Get all events matching the filter
    const events = await Event.find(eventFilter);
    
    // Build date filter for registrations/payments
    const dateFilter = {};
    if (start_date || end_date) {
      dateFilter.createdAt = {};
      if (start_date) {
        dateFilter.createdAt.$gte = new Date(start_date);
      }
      if (end_date) {
        dateFilter.createdAt.$lte = new Date(end_date);
      }
    }
    
    // Aggregate revenue by event
    const reportData = await Promise.all(
      events.map(async (event) => {
        // Get all paid registrations for this event
        const registrations = await Registration.find({
          event_id: event._id,
          payment_status: { $in: ['paid', 'free'] },
          ...dateFilter
        });
        
        // Calculate revenue from registrations
        let revenue = 0;
        let paidCount = 0;
        let freeCount = 0;
        
        registrations.forEach(reg => {
          if (reg.payment_status === 'paid') {
            revenue += reg.payment_amount || 0;
            paidCount++;
          } else if (reg.payment_status === 'free') {
            freeCount++;
          }
        });
        
        // Also check Payment model for additional payments
        const payments = await Payment.find({
          event_id: event._id,
          payment_status: 'completed',
          ...dateFilter
        });
        
        payments.forEach(payment => {
          revenue += payment.amount || 0;
        });
        
        return {
          event_id: event._id,
          event_name: event.name,
          event_type: event.type,
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
          revenue: revenue,
          total_registrations: registrations.length,
          paid_registrations: paidCount,
          free_registrations: freeCount,
          capacity: event.type === 'Workshop' ? event.workshop?.capacity : 
                   event.type === 'Trip' ? event.trip?.capacity : null
        };
      })
    );
    
    // Filter by event date range if specified (for when events occurred)
    // This filters events that occurred within the date range
    let filteredReport = reportData;
    if (start_date || end_date) {
      filteredReport = reportData.filter(item => {
        const eventStart = new Date(item.start_date);
        const eventEnd = new Date(item.end_date);
        const filterStart = start_date ? new Date(start_date) : null;
        const filterEnd = end_date ? new Date(end_date) : null;
        
        // Event must overlap with the filter date range
        // Event is included if:
        // - Event starts before or on filter end date AND
        // - Event ends after or on filter start date
        if (filterStart && eventEnd < filterStart) return false; // Event ended before filter start
        if (filterEnd && eventStart > filterEnd) return false; // Event starts after filter end
        return true; // Event overlaps with date range
      });
    }
    
    // Sort by revenue
    filteredReport.sort((a, b) => {
      if (sort_by === 'revenue') {
        return sort_order === 'asc' ? a.revenue - b.revenue : b.revenue - a.revenue;
      } else if (sort_by === 'event_name') {
        return sort_order === 'asc' 
          ? a.event_name.localeCompare(b.event_name)
          : b.event_name.localeCompare(a.event_name);
      } else if (sort_by === 'start_date') {
        return sort_order === 'asc'
          ? new Date(a.start_date) - new Date(b.start_date)
          : new Date(b.start_date) - new Date(a.start_date);
      }
      return 0;
    });
    
    // Calculate totals
    const totals = {
      total_revenue: filteredReport.reduce((sum, item) => sum + item.revenue, 0),
      total_registrations: filteredReport.reduce((sum, item) => sum + item.total_registrations, 0),
      total_paid_registrations: filteredReport.reduce((sum, item) => sum + item.paid_registrations, 0),
      total_free_registrations: filteredReport.reduce((sum, item) => sum + item.free_registrations, 0),
      total_events: filteredReport.length
    };
    
    res.status(200).json({
      success: true,
      report: filteredReport,
      totals,
      filters: {
        event_type: event_type || 'all',
        start_date: start_date || null,
        end_date: end_date || null,
        sort_by,
        sort_order
      }
    });
    
  } catch (err) {
    console.error('Error generating sales report:', err);
    res.status(500).json({ 
      success: false,
      error: "Server error",
      message: err.message 
    });
  }
};

