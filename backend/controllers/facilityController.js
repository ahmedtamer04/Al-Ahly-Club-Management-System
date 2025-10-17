import Facility from "../models/Facility.js";

//  POST - Add a new facility 
export const addFacility = async (req, res) => {
  try {
    const facility = new Facility(req.body);
    await facility.save();
    res.status(201).json({ message: "Facility added successfully", facility });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  GET - View all facilities with availability details
export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find();
    
    // Enhance response with formatted availability information
    const facilitiesWithDetails = facilities.map(facility => {
      const facilityObj = facility.toObject();
      
      // Add formatted availability information
      if (facilityObj.availability && facilityObj.availability.length > 0) {
        facilityObj.availabilityDetails = facilityObj.availability.map(slot => ({
          date: slot.date,
          formattedDate: new Date(slot.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          times: slot.times,
          totalSlots: slot.times ? slot.times.length : 0
        }));
        
        // Add summary statistics
        facilityObj.availabilitySummary = {
          totalDays: facilityObj.availability.length,
          totalTimeSlots: facilityObj.availability.reduce((total, slot) => 
            total + (slot.times ? slot.times.length : 0), 0),
          nextAvailableDate: facilityObj.availability.length > 0 ? 
            facilityObj.availability[0].date : null
        };
      } else {
        facilityObj.availabilityDetails = [];
        facilityObj.availabilitySummary = {
          totalDays: 0,
          totalTimeSlots: 0,
          nextAvailableDate: null
        };
      }
      
      return facilityObj;
    });
    
    res.status(200).json(facilitiesWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
