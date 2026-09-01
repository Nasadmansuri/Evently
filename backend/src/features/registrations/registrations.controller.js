const registrationsModel = require('./registrations.model');
const eventsModel = require('../events/events.model');
const usersModel = require('../users/users.model');
const { sendMail, buildRegistrationConfirmationEmail } = require('../../shared/services/mailer.service');

async function register(req, res) {
  try {
    const { eventId, teamMembers } = req.body;
    if (!eventId) {
      return res.status(400).json({ message: 'Missing event ID' });
    }

    const event = await eventsModel.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Security Gate: Block registration if event is cancelled, concluded, or in the past
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is closed: This event has been cancelled.' });
    }
    if (event.status === 'completed' || event.status === 'concluded') {
      return res.status(400).json({ message: 'Registration is closed: This event has concluded.' });
    }

    const eventDateStr = String(event.event_date).slice(0, 10);
    const eventEnd = new Date(`${eventDateStr}T23:59:59+05:45`);
    if (new Date() > eventEnd) {
      return res.status(400).json({ message: 'Registration is closed for past events.' });
    }

    const existing = await registrationsModel.findRegistration(eventId, req.user.id);
    if (existing) {
      return res.status(409).json({ message: 'You are already registered for this event' });
    }

    if (event.max_participants) {
      const count = await registrationsModel.getRegistrationCount(eventId);
      if (count >= event.max_participants) {
        return res.status(400).json({ message: 'This event has reached maximum capacity' });
      }
    }

    const registrationId = await registrationsModel.createRegistration({
      eventId, userId: req.user.id, teamMembers,
    });

    res.status(201).json({ message: 'Registered successfully', registrationId });

    // Fire-and-forget confirmation email — runs after the response is sent,
    // so a slow/failed email never delays or breaks registration itself.
    usersModel.getProfile(req.user.id)
      .then((profile) => {
        if (!profile || !profile.email) {
          console.warn('[REGISTRATION]: No email found for user ID', req.user.id);
          return;
        }
        const html = buildRegistrationConfirmationEmail({
          studentName: profile.full_name,
          eventTitle: event.title,
          eventDate: event.event_date,
          eventTime: event.event_time,
          location: event.location,
          category: event.category,
          teamName: event.is_team_event ? teamMembers : null,
          eventId: event.id,
          organizerName: event.organizing_department,
        });
        return sendMail({
          to: profile.email,
          subject: `✅ Registration Confirmed: ${event.title}`,
          html,
        });
      })
      .catch((err) => console.error('[REGISTRATION ERROR]: Confirmation email failed:', err.message));
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
}

async function getMyRegistrations(req, res) {
  try {
    const registrations = await registrationsModel.getMyRegistrations(req.user.id);
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load registrations', error: err.message });
  }
}

module.exports = { register, getMyRegistrations };