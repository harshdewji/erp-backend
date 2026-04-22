const express = require('express');
const router = express.Router();
const {
  addFeeRecord,
  getFeesByStudent,
  getAllFees,
  downloadFeeReceipt,
  addResult,
  getResultsByStudent,
  exportStudents,
  uploadProfileImage,
  getDashboardStats,
  getNotifications,
  markNotificationRead,
  createExam,
  getExamsByCourse,
  getBooks,
  addBook,
  getHostels,
  getRooms,
  getTransportRoutes,
  createRazorpayOrder,
  verifyRazorpayPayment,
  settleFees
} = require('../controllers/advancedController');
const adminController = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');
const logActivity = require('../middlewares/activityMiddleware');
const upload = require('../config/multer');

// Dashboard & Notifications
router.get('/stats', protect, getDashboardStats);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

// Admin Control Panel
router.get('/admin/users', protect, authorize('Admin', 'Teacher'), adminController.getAllUsers);
router.put('/admin/users/:id/toggle', protect, authorize('Admin', 'Teacher'), adminController.toggleUserActive);
router.post('/admin/settings', protect, authorize('Admin'), adminController.updateSystemSettings);

// Fees
router.post('/fees', protect, authorize('Admin'), logActivity('Collect Fee'), addFeeRecord);
router.post('/fees/settle', protect, settleFees);
router.post('/fees/razorpay/order', protect, createRazorpayOrder);
router.post('/fees/razorpay/verify', protect, verifyRazorpayPayment);
router.get('/fees/all', protect, authorize('Admin', 'Teacher'), getAllFees);
router.get('/fees/student/:studentId', protect, getFeesByStudent);
router.get('/fees/receipt/:feeId', protect, downloadFeeReceipt);

// Results
router.get('/results/student/:studentId', protect, getResultsByStudent);

// Library
router.get('/library/books', protect, getBooks);
router.post('/library/books', protect, authorize('Admin', 'Teacher'), addBook);

// Hostel
router.get('/hostels', protect, getHostels);
router.get('/hostels/rooms', protect, getRooms);

// Transport
router.get('/transport/routes', protect, getTransportRoutes);

// Exams & Results
router.post('/exams', protect, authorize('Admin', 'Teacher'), createExam);
router.get('/exams/course/:courseId', protect, getExamsByCourse);
router.post('/results', protect, authorize('Teacher', 'Admin'), logActivity('Post Result'), addResult);

// Export
router.get('/export/students', protect, authorize('Admin', 'Teacher'), exportStudents);

// Profile
router.get('/profile/me', protect, adminController.getMyProfile);
router.post('/profile/image', protect, upload.single('profile'), uploadProfileImage);

module.exports = router;
