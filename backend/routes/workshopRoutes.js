const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const auth = require('../middleware/auth');

// Create a workshop
router.post('/', auth, workshopController.createWorkshop);

// Edit a workshop
router.put('/:id', auth, workshopController.editWorkshop);

// View all workshops created by the user
router.get('/my', auth, workshopController.getMyWorkshops);

module.exports = router;
