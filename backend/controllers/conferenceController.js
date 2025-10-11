import Conference from "../models/conference.js";

export const createConference = async (req, res) => {
  try {
    const { name, start_date, end_date, description, agenda, website, budget, funding_source, resources } = req.body;

    if (!name || !start_date || !end_date || !description || !agenda || !website || !budget || !funding_source || !resources) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const session = new Conference({ name, start_date, end_date, description, agenda, website, budget, funding_source, resources });
    await session.save();

    res.status(201).json({ message: " Conference created successfully", session });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};