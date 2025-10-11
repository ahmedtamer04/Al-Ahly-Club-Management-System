const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, enum: ['GUC', 'GUC BERLIN'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  time: { type: String, required: true },
  shortDescription: { type: String, required: true },
  fullAgenda: { type: String, required: true },
  facultyResponsible: { type: String, required: true },
  professorsParticipating: [{ type: String, required: true }],
  requiredBudget: { type: Number, required: true },
  fundingSource: { type: String, enum: ['GUC', 'EXTERIOR SOURCE'], required: true },
  extraRequiredSources: { type: String },
  capacity: { type: Number, required: true },
  registrationDeadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Workshop', WorkshopSchema);
