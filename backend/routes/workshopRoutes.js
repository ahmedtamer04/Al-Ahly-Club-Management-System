const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const { auth, requireVendor } = require('../middleware/auth');

// Create a workshop (Vendor only)
router.post('/', auth, requireVendor, workshopController.createWorkshop);

// Edit a workshop (Vendor only)
router.put('/:id', auth, requireVendor, workshopController.editWorkshop);

// View all workshops created by the user (Vendor only)
router.get('/my', auth, requireVendor, workshopController.getMyWorkshops);

module.exports = router;
