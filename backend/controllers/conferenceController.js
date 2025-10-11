import Conference from "../models/conference.js";

export const createConference = async (req, res) => {
  try {
    const { name, start_date, end_date, description, agenda, website, budget, funding_source, resources } = req.body;

    if (!name || !start_date || !end_date || !description || !agenda || !website || !budget || !funding_source || !resources) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const conference = new Conference({ name, start_date, end_date, description, agenda, website, budget, funding_source, resources });
    await conference.save();

    res.status(201).json({ message: " Conference created successfully", conference });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editConference = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, start_date, end_date, description, agenda, website, budget, funding_source, resources } = req.body;

    const updatedConference = await Conference.findByIdAndUpdate(
      id,
      { name, start_date, end_date, description, agenda, website, budget, funding_source, resources },
      { new: true }
    );

    if (!updatedConference) {
      return res.status(404).json({ message: "Conference not found" });
    }

    res.status(200).json({ message: " Conference updated successfully", updatedConference });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};