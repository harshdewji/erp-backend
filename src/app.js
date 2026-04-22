const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { errorHandler } = require('./middlewares/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const advancedRoutes = require('./routes/advancedRoutes');
const proRoutes = require('./routes/proRoutes');
const edusecRoutes = require('./routes/edusecRoutes');
const hrmsRoutes = require('./routes/hrmsRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/advanced', advancedRoutes);
app.use('/api/pro', proRoutes);
app.use('/api/edusec', edusecRoutes);
app.use('/api/hrms', hrmsRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Noctra India Enterprise ERP API' });
});

// Error Handler
app.use(errorHandler);

module.exports = app;
