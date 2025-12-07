import Event from "../models/Events.js";
import Registration from "../models/Registration.js";

// Generate iCalendar (.ics) file for an event
export const generateCalendar = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    // Get event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found." });
    }

    // Check if user is registered for this event
    const registration = await Registration.findOne({
      event_id: eventId,
      user_id: userId,
      status: 'registered'
    });

    if (!registration) {
      return res.status(403).json({ 
        message: "You must be registered for this event to add it to your calendar." 
      });
    }

    // Format dates for iCalendar format (YYYYMMDDTHHMMSS)
    const formatICalDate = (date) => {
      const d = new Date(date);
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Generate unique identifier
    const uid = `${event._id}@al-ahly-guc.edu`;

    // Create iCalendar content
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Al-Ahly Club//Events//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Al-Ahly Events',
      'X-WR-TIMEZONE:Africa/Cairo',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.name}`,
      `DESCRIPTION:${(event.short_description || '').replace(/\n/g, '\\n')}`,
      `LOCATION:${event.location || ''}`,
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'BEGIN:VALARM',
      'TRIGGER:-PT24H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Event tomorrow',
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Event in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Set headers for .ics file download
    const filename = `${event.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.send(icsContent);

  } catch (error) {
    console.error('Error generating calendar:', error);
    res.status(500).json({ 
      message: "Server error.", 
      error: error.message 
    });
  }
};
