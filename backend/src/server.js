const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const pool = require('./shared/config/db');;
require('./shared/config/mailer');
const authRoutes = require('./features/auth/auth.routes');
const usersRoutes = require('./features/users/users.routes');
const eventsRoutes = require('./features/events/events.routes');
const registrationsRoutes = require('./features/registrations/registrations.routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/notifications', require('./features/notifications/notifications.routes'));
app.use('/api/feedback', require('./features/feedback/feedback.routes'));

app.get('/api/db-test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Evently API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

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