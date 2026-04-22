const db = require('../config/db');

const logActivity = (action) => {
  return async (req, res, next) => {
    // We log after the response is sent to avoid delaying the request
    res.on('finish', async () => {
      if (req.user && res.statusCode < 400) {
        try {
          const userAction = `${action}: ${req.method} ${req.originalUrl}`;
          await db.query(
            'INSERT INTO activity_logs (user_id, action) VALUES ($1, $2)',
            [req.user.id, userAction]
          );
        } catch (error) {
          console.error('Activity Log Error:', error);
        }
      }
    });
    next();
  };
};

module.exports = logActivity;
