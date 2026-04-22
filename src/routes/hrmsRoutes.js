const express = require('express');
const router = express.Router();
const hrmsController = require('../controllers/hrmsController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Protected routes (Admin level typically)
router.use(protect);

router.get('/departments', hrmsController.getDepartments);
router.post('/departments', authorize('Admin'), hrmsController.addDepartment);

router.get('/staff', hrmsController.getAllStaff);
router.post('/staff', authorize('Admin'), hrmsController.addStaffMember);

router.get('/payroll', authorize('Admin'), hrmsController.getPayrollHistory);
router.post('/payroll', authorize('Admin'), hrmsController.generatePayroll);

router.post('/leaves', hrmsController.applyForLeave);
router.patch('/leaves/:id', authorize('Admin'), hrmsController.updateLeaveStatus);

module.exports = router;
