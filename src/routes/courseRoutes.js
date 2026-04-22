const express = require('express');
const router = express.Router();
const { createCourse, deleteCourse, assignStudentToCourse, getCourses } = require('../controllers/courseController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, getCourses);
router.post('/', protect, authorize('Admin'), createCourse);
router.put('/assign', protect, authorize('Admin'), assignStudentToCourse);
router.delete('/:id', protect, authorize('Admin'), deleteCourse);

module.exports = router;
