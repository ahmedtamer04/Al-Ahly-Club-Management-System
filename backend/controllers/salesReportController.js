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
    const { event_id, event_type, name, start_date, end_date, sort_by = 'revenue', sort_order = 'desc' } = req.query;
    
    // Build base filter for events
    const eventFilter = {};
    // Prefer explicit event_id filter when provided (single event or comma-separated list)
    if (event_id) {
      // support comma-separated list of ids
      const ids = String(event_id).split(',').map(id => id.trim()).filter(Boolean);
      if (ids.length === 1) eventFilter._id = ids[0];
      else eventFilter._id = { $in: ids };
    }

    if (event_type && event_type !== 'all') {
      eventFilter.type = event_type;
    }

    // Filter by event name (search) - match against name or short_description
    if (name && name.trim().length > 0) {
      const regex = new RegExp(name.trim(), 'i');
      eventFilter.$or = [
        { name: regex },
        { short_description: regex }
      ];
    }

    // Filter events by event date overlap (only if valid start_date/end_date values were provided)
    // This keeps filters independent: passing invalid/empty dates won't break the query.
    const parseValidDate = (v) => {
      if (!v && v !== 0) return null; // treat empty/undefined as no-date
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    };

    const parsedStart = parseValidDate(start_date);
    const parsedEnd = parseValidDate(end_date);

    if (parsedStart || parsedEnd) {
      if (parsedStart && parsedEnd) {
        // overlap: event.start_date <= filterEnd AND event.end_date >= filterStart
        eventFilter.$and = [
          { start_date: { $lte: parsedEnd } },
          { end_date: { $gte: parsedStart } }
        ];
      } else if (parsedStart) {
        // events that end on or after filterStart
        eventFilter.end_date = { $gte: parsedStart };
      } else if (parsedEnd) {
        // events that start on or before filterEnd
        eventFilter.start_date = { $lte: parsedEnd };
      }
    }
    
    // Get all events matching the filter
    const events = await Event.find(eventFilter);
    
    // NOTE: start_date/end_date are treated here as event date filters (events overlapping the window).
    // We DO NOT filter payments/registrations by createdAt using these params because that would make
    // the filters dependent on each other (e.g. event date + registration date). If you need registration
    // date filtering separately, we can add explicit params later (e.g. reg_start/reg_end).
    
    // Aggregate revenue by event
    const reportData = await Promise.all(
      events.map(async (event) => {
        // Fetch payments first (treat Payment records as authoritative)
        const payments = await Payment.find({
          event_id: event._id,
          payment_status: 'completed'
        });

        // Sum completed payments
        let revenue = 0;
        const paymentRegistrationIds = new Set();
        payments.forEach(payment => {
          revenue += payment.amount || 0;
          if (payment.registration_id) paymentRegistrationIds.add(payment.registration_id.toString());
        });

        // Get registrations for this event — count all active (registered) ones (attendees)
        const registrations = await Registration.find({
          event_id: event._id,
          status: 'registered'
        });

        // Calculate revenue coming from registrations that DO NOT have a linked Payment record.
        // This avoids double-counting when a Payment document exists for the same registration.
        let paidCount = 0;
        let freeCount = 0;
        let pendingCount = 0;

        registrations.forEach(reg => {
          const regId = reg._id?.toString();
          // Only add registration.payment_amount when there's no corresponding Payment record
          if (reg.payment_status === 'paid' && !paymentRegistrationIds.has(regId)) {
            revenue += reg.payment_amount || 0;
          }

          if (reg.payment_status === 'paid') paidCount++;
          else if (reg.payment_status === 'free') freeCount++;
          else if (reg.payment_status === 'pending') pendingCount++;
        });

        return {
          event_id: event._id,
          event_name: event.name,
          event_type: event.type,
          start_date: event.start_date,
          end_date: event.end_date,
          location: event.location,
          revenue: revenue,
          // attendees = all active registrations (regardless of payment status)
          total_attendees: registrations.length,
          paid_registrations: paidCount,
          free_registrations: freeCount,
          unpaid_registrations: pendingCount,
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
      // total_attendees is the sum of all registered (attendees)
      total_attendees: filteredReport.reduce((sum, item) => sum + (item.total_attendees || 0), 0),
      total_paid_registrations: filteredReport.reduce((sum, item) => sum + item.paid_registrations, 0),
      total_free_registrations: filteredReport.reduce((sum, item) => sum + item.free_registrations, 0),
      total_unpaid_registrations: filteredReport.reduce((sum, item) => sum + (item.unpaid_registrations || 0), 0),
      total_events: filteredReport.length
    };
    
    // Support CSV download via ?format=csv
    const { format } = req.query;
    if (format === 'csv') {
      // Build CSV header
      const headers = [
        'event_id', 'event_name', 'event_type', 'start_date', 'end_date', 'location',
        'revenue', 'total_attendees', 'paid_registrations', 'free_registrations', 'unpaid_registrations', 'capacity'
      ];

      const escapeCsv = (value) => {
        if (value === null || value === undefined) return '';
        const str = value instanceof Date ? value.toISOString() : String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      };

      const rows = filteredReport.map(row => (
        headers.map(h => escapeCsv(row[h] ?? (h === 'unpaid_registrations' ? row['unpaid_registrations'] ?? '' : '')))
      ));

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="sales-report.csv"');
      return res.status(200).send(csv);
    }

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

