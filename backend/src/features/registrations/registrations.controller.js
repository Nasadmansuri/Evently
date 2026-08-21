const registrationsModel = require('./registrations.model');
const eventsModel = require('../events/events.model');

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

    // Security Gate: Block registration if the event has already passed
    const eventDate = new Date(event.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to midnight for accurate day comparison
    if (eventDate < today) {
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