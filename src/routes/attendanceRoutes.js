const express = require('express');
const router = express.Router();
const { markAttendance, getAttendanceByStudent, getAllAttendance, studentCheckIn } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, authorize('Teacher', 'Admin'), getAllAttendance);
router.post('/', protect, authorize('Teacher', 'Admin'), markAttendance);
router.post('/check-in', protect, authorize('Student'), studentCheckIn);
router.get('/student/:id', protect, getAttendanceByStudent);

module.exports = router;
