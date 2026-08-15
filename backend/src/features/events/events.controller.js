const eventsModel = require('./events.model');

async function getMyEvents(req, res) {
  try {
    const events = await eventsModel.getEventsByFaculty(req.user.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
}

async function getMyStats(req, res) {
  try {
    const stats = await eventsModel.getFacultyStats(req.user.id);
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stats', error: err.message });
  }
}

async function createEvent(req, res) {
  try {
    const {
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants,
    } = req.body;

    if (!title || !description || !category || !location || !eventDate || !eventTime || !organizingDepartment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const eventId = await eventsModel.createEvent({
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants, userId: req.user.id,
    });

    res.status(201).json({ message: 'Event created successfully', eventId });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const { category } = req.query;
    const events = await eventsModel.getAllEvents({ category });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load event', error: err.message });
  }
}

module.exports = { getMyEvents, getMyStats, createEvent, getAllEvents, getEventById };