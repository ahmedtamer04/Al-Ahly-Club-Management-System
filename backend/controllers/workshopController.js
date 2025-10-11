const Workshop = require('../models/Workshop');

// Create a new workshop
exports.createWorkshop = async (req, res) => {
  try {
    const workshop = new Workshop({
      ...req.body,
      createdBy: req.user._id
    });
    await workshop.save();
    res.status(201).json(workshop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Edit a workshop (only by creator)
exports.editWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!workshop) return res.status(404).json({ error: 'Workshop not found or not authorized' });
    Object.assign(workshop, req.body);
    await workshop.save();
    res.json(workshop);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// View all workshops created by the user
exports.getMyWorkshops = async (req, res) => {
  try {
    const workshops = await Workshop.find({ createdBy: req.user._id });
    res.json(workshops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
