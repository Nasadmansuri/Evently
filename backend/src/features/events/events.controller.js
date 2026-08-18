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
    const events = await eventsModel.getAllEvents({ category }, req.user.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load event', error: err.message });
  }
}

async function getRecommended(req, res) {
  try {
    const events = await eventsModel.getRecommendedEvents(req.user.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load recommendations', error: err.message });
  }
}

async function getAllEventsAdmin(req, res) {
  try {
    const events = await eventsModel.getAllEventsAdmin();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete events you created' });
    }

    await eventsModel.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete event', error: err.message });
  }
}

async function getAdminStats(req, res) {
  try {
    const stats = await eventsModel.getAdminStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load stats', error: err.message });
  }
}

async function updateEvent(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only edit events you created' });
    }

    const {
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants,
    } = req.body;

    if (!title || !description || !category || !location || !eventDate || !eventTime || !organizingDepartment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    await eventsModel.updateEvent(req.params.id, {
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility, prizeInfo, maxParticipants,
    });

    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
}

module.exports = { getMyEvents, getMyStats, createEvent, getAllEvents, getEventById, getRecommended, getAllEventsAdmin, deleteEvent, getAdminStats, updateEvent };