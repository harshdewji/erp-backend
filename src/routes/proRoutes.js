const express = require('express');
const router = express.Router();
const proController = require('../controllers/proController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Placements
router.get('/placements', protect, proController.getPlacements);
router.post('/placements', protect, authorize('Admin'), proController.addPlacement);

// Alumni
router.get('/alumni', protect, proController.getAlumni);

// Scholarships
router.get('/scholarships', protect, proController.getScholarships);

// Messaging
router.get('/messages', protect, proController.getMessages);
router.post('/messages', protect, proController.sendMessage);

// Events
router.get('/events', protect, proController.getEvents);

module.exports = router;
