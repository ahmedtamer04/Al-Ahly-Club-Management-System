const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const { auth, requireProfessor } = require('../middleware/auth');

// Create a workshop (Professor only)
router.post('/', auth, requireProfessor, workshopController.createWorkshop);

// Edit a workshop (Professor only)
router.put('/:id', auth, requireProfessor, workshopController.editWorkshop);

// View all workshops created by the user (Professor only)
router.get('/my', auth, requireProfessor, workshopController.getMyWorkshops);

module.exports = router;
