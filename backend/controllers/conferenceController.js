import Conference from "../models/conference.js";

export const createConference = async (req, res) => {
  try {
    const { name, startDate, endDate, description, agenda, website, budget, fundingSource, resources } = req.body;

    if (!name || !startDate || !endDate || !description || !agenda || !website || !budget || !fundingSource || !resources) {
      return res.status(400).json({ message: "All fields are required: name, startDate, endDate, description, agenda, website, budget, fundingSource, resources" });
    }

    if (!startDate || new Date(startDate) < new Date()) {
      return res.status(400).json({ message: "Start date must be in the future" });
    }

    const conference = new Conference({ name, startDate, endDate, description, agenda, website, budget, fundingSource, resources });
    await conference.save();

    res.status(201).json({ message: " Conference created successfully", conference });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const editConference = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, description, agenda, website, budget, fundingSource, resources } = req.body;

    const updatedConference = await Conference.findByIdAndUpdate(
      id,
      { name, startDate, endDate, description, agenda, website, budget, fundingSource, resources },
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