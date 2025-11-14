import Facility from "../models/Facility.js";
import CourtReservation from "../models/CourtReservation.js";
import User from "../models/User.js";

// Get available courts with available time slots
export const getAvailableCourts = async (req, res) => {
  try {
    const { sport, date } = req.query;

    // Build filter
    let filter = { status: 'available' };
    if (sport && ['Basketball', 'Football', 'Tennis'].includes(sport)) {
      filter['attributes.sport'] = sport;
    }

    const facilities = await Facility.find(filter);

    // Get reservations for the specified date (if provided)
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const reservations = await CourtReservation.find({
      reservation_date: { $gte: targetDate, $lt: nextDay },
      status: 'confirmed'
    });

    // Create a map of reserved slots
    const reservedSlots = {};
    reservations.forEach(res => {
      const key = `${res.facility_id.toString()}-${res.reservation_time}`;
      reservedSlots[key] = true;
    });

    // Process facilities and their availability
    const courtsWithAvailability = facilities.map(facility => {
      // Get available times from facility availability
      const dateAvailability = facility.availability.find(avail => {
        const availDate = new Date(avail.date);
        availDate.setHours(0, 0, 0, 0);
        return availDate.getTime() === targetDate.getTime();
      });

      const availableTimes = dateAvailability ? dateAvailability.times : [];
      
      // Filter out reserved times
      const freeTimes = availableTimes.filter(time => {
        const key = `${facility._id.toString()}-${time}`;
        return !reservedSlots[key];
      });

      return {
        _id: facility._id,
        name: facility.name,
        location: facility.location,
        sport: facility.attributes.sport,
        indoor: facility.attributes.indoor,
        available_times: freeTimes,
        all_times: availableTimes
      };
    });

    res.json({
      success: true,
      message: "Available courts retrieved successfully",
      date: targetDate.toISOString().split('T')[0],
      courts: courtsWithAvailability
    });
  } catch (error) {
    console.error('Error fetching available courts:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create court reservation
export const createCourtReservation = async (req, res) => {
  try {
    const { facility_id, reservation_date, reservation_time } = req.body;

    // Validate required fields
    if (!facility_id || !reservation_date || !reservation_time) {
      return res.status(400).json({
        message: "Facility ID, reservation date, and reservation time are required"
      });
    }

    // Check if user is a student
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        message: "Only students can reserve courts"
      });
    }

    // Get student info
    const student = await User.findById(req.user._id);
    if (!student) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if facility exists
    const facility = await Facility.findById(facility_id);
    if (!facility) {
      return res.status(404).json({ message: "Facility not found" });
    }

    if (facility.status !== 'available') {
      return res.status(400).json({ message: "This facility is currently unavailable" });
    }

    // Validate date
    const reservationDate = new Date(reservation_date);
    reservationDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      return res.status(400).json({ message: "Cannot reserve courts for past dates" });
    }

    // Check if the time slot is available in facility availability
    const dateAvailability = facility.availability.find(avail => {
      const availDate = new Date(avail.date);
      availDate.setHours(0, 0, 0, 0);
      return availDate.getTime() === reservationDate.getTime();
    });

    if (!dateAvailability || !dateAvailability.times.includes(reservation_time)) {
      return res.status(400).json({ 
        message: "The selected time slot is not available for this facility on this date" 
      });
    }

    // Check if already reserved
    const existingReservation = await CourtReservation.findOne({
      facility_id,
      reservation_date: reservationDate,
      reservation_time,
      status: 'confirmed'
    });

    if (existingReservation) {
      return res.status(409).json({ 
        message: "This time slot is already reserved" 
      });
    }

    // Check if student already has a reservation for this date and time
    const studentReservation = await CourtReservation.findOne({
      student_id: req.user._id,
      reservation_date: reservationDate,
      reservation_time,
      status: 'confirmed'
    });

    if (studentReservation) {
      return res.status(409).json({ 
        message: "You already have a reservation for this date and time" 
      });
    }

    // Create reservation
    const reservation = new CourtReservation({
      facility_id,
      student_id: req.user._id,
      student_name: `${student.first_name} ${student.last_name}`,
      guc_id: student.id_number,
      reservation_date: reservationDate,
      reservation_time,
      status: 'confirmed'
    });

    await reservation.save();
    await reservation.populate('facility_id', 'name location attributes');

    res.status(201).json({
      message: "Court reservation created successfully",
      reservation: {
        _id: reservation._id,
        facility: {
          _id: reservation.facility_id._id,
          name: reservation.facility_id.name,
          location: reservation.facility_id.location,
          sport: reservation.facility_id.attributes.sport
        },
        student_name: reservation.student_name,
        guc_id: reservation.guc_id,
        reservation_date: reservation.reservation_date,
        reservation_time: reservation.reservation_time,
        status: reservation.status,
        created_at: reservation.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating court reservation:', error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "This time slot is already reserved" 
      });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation failed", errors });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get student's court reservations
export const getMyCourtReservations = async (req, res) => {
  try {
    if (req.user.role !== 'Student') {
      return res.status(403).json({
        message: "Only students can view court reservations"
      });
    }

    const reservations = await CourtReservation.find({
      student_id: req.user._id,
      status: 'confirmed'
    })
    .populate('facility_id', 'name location attributes')
    .sort({ reservation_date: 1, reservation_time: 1 });

    res.json({
      success: true,
      message: "Court reservations retrieved successfully",
      count: reservations.length,
      reservations: reservations.map(res => ({
        _id: res._id,
        facility: {
          _id: res.facility_id._id,
          name: res.facility_id.name,
          location: res.facility_id.location,
          sport: res.facility_id.attributes.sport,
          indoor: res.facility_id.attributes.indoor
        },
        student_name: res.student_name,
        guc_id: res.guc_id,
        reservation_date: res.reservation_date,
        reservation_time: res.reservation_time,
        created_at: res.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching court reservations:', error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel court reservation
export const cancelCourtReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    if (req.user.role !== 'Student') {
      return res.status(403).json({
        message: "Only students can cancel court reservations"
      });
    }

    const reservation = await CourtReservation.findOne({
      _id: reservationId,
      student_id: req.user._id,
      status: 'confirmed'
    });

    if (!reservation) {
      return res.status(404).json({ 
        message: "Reservation not found or already cancelled" 
      });
    }

    reservation.status = 'cancelled';
    reservation.cancelled_at = new Date();
    await reservation.save();

    res.json({
      message: "Court reservation cancelled successfully",
      reservation: {
        _id: reservation._id,
        status: reservation.status,
        cancelled_at: reservation.cancelled_at
      }
    });
  } catch (error) {
    console.error('Error cancelling court reservation:', error);
    res.status(500).json({ message: error.message });
  }
};

