const express = require('express');
const router = express.Router();
const { addStudent, getAllStudents, updateStudent, deleteStudent } = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.route('/')
  .get(protect, getAllStudents)
  .post(protect, authorize('Admin'), addStudent);

router.route('/:id')
  .put(protect, authorize('Admin', 'Teacher'), updateStudent)
  .delete(protect, authorize('Admin'), deleteStudent);

module.exports = router;
