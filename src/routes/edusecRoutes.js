const express = require('express');
const router = express.Router();
const edusecController = require('../controllers/edusecController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/campuses', protect, edusecController.getCampuses);

// Inquiries — protected (Admin/Teacher manage leads)
router.get('/inquiries',      protect, authorize('Admin', 'Teacher'), edusecController.getInquiries);
router.post('/inquiries',     protect, authorize('Admin', 'Teacher'), edusecController.addInquiry);
router.patch('/inquiries/:id', protect, authorize('Admin', 'Teacher'), edusecController.updateInquiry);
router.post('/inquiries/:id/convert', protect, authorize('Admin', 'Teacher'), edusecController.convertInquiry);

// Timetable
router.get('/timetable/:course_id', protect, edusecController.getTimetable);
router.post('/timetable', protect, authorize('Admin'), edusecController.addTimetableEntry);

router.get('/announcements', protect, edusecController.getAnnouncements);
router.get('/exams', protect, edusecController.getExams);
router.get('/exams/hall-ticket/:examId', protect, edusecController.generateHallTicket);
router.get('/fees', protect, edusecController.getFees);
router.get('/resources', protect, edusecController.getResources);
router.post('/resources/book', protect, edusecController.bookResource);
router.get('/late-arrivals', protect, authorize('Admin', 'Teacher'), edusecController.getLateArrivals);
router.get('/search', protect, edusecController.globalSearch);

// Payroll
router.get('/payroll', protect, authorize('Admin'), edusecController.getPayroll);

module.exports = router;
