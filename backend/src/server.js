const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./shared/config/db');
require('./shared/config/mailer');

const authRoutes = require('./features/auth/auth.routes');
const usersRoutes = require('./features/users/users.routes');
const eventsRoutes = require('./features/events/events.routes');
const registrationsRoutes = require('./features/registrations/registrations.routes');
const notificationsRoutes = require('./features/notifications/notifications.routes');
const feedbackRoutes = require('./features/feedback/feedback.routes');

const app = express();

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// CORS Configuration
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*') || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/feedback', feedbackRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Evently API is healthy and operational' });
});

// Centralized Error Handling Middleware (Sanitizes internal server details in production)
app.use((err, req, res, next) => {
  console.error('[UNHANDLED ERROR]:', err);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Evently API Server running on http://localhost:${PORT}`);

  // Background auto-publisher for scheduled events (runs every 30 seconds)
  const { autoPublishScheduledEvents } = require('./features/events/events.model');
  const notificationsModel = require('./features/notifications/notifications.model');

  setInterval(async () => {
    try {
      const newlyPublished = await autoPublishScheduledEvents();
      if (newlyPublished && newlyPublished.length > 0) {
        console.log(`Auto-published ${newlyPublished.length} scheduled event(s)`);
        for (const ev of newlyPublished) {
          const [users] = await pool.query('SELECT id FROM users WHERE role = "student" AND id != ?', [ev.created_by]);
          const userIds = users.map((u) => u.id);
          if (userIds.length > 0) {
            await notificationsModel.createForUsers(userIds, {
              title: `Event Live: ${ev.title}`,
              message: `${ev.organizing_department || 'DevCorps'} just published a new ${ev.category} event — check it out!`,
            });
          }
        }
      }
    } catch (err) {
      console.error('Auto-publisher background job error:', err.message);
    }
  }, 30000);
});