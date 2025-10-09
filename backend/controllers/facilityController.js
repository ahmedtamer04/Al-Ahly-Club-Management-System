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

//  GET - View all courts
export const getAllFacilities = async (req, res) => {
  try {
    const facilities = await Facility.find();
    res.status(200).json(facilities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
