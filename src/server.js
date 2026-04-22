const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const app = require('./app');
const initDb = require('./models/initDb');
const initCronJobs = require('./utils/cronJobs');

const PORT = process.env.PORT || 5000;

// Initialize Database and Cron Jobs before starting server
const startServer = async () => {
  try {
    await initDb();
    initCronJobs();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Global Error Handlers to prevent app crash on network fluctuations (e.g. ECONNRESET)
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Do not exit, just log it. Node/PG will try to recover the pool.
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  if (err.code === 'ECONNRESET') {
    console.warn('Network Reset (ECONNRESET) caught. System will attempt recovery.');
  } else {
    // For other critical errors, you might want to exit, but for network we stay alive.
    // process.exit(1); 
  }
});

startServer();
