const feedbackModel = require('./feedback.model');
const eventsModel = require('../events/events.model');
const registrationsModel = require('../registrations/registrations.model');

const VALID_TYPES = ['short_text', 'long_text', 'rating', 'multiple_choice'];

async function createForm(req, res) {
  try {
    const { eventId, title, description, questions } = req.body;

    if (!eventId || !title || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'eventId, title, and at least one question are required' });
    }

    for (const q of questions) {
      if (!q.questionText || !VALID_TYPES.includes(q.questionType)) {
        return res.status(400).json({ message: `Invalid question: ${JSON.stringify(q)}` });
      }
      if (q.questionType === 'multiple_choice' && (!Array.isArray(q.options) || q.options.length < 2)) {
        return res.status(400).json({ message: 'Multiple-choice questions need at least 2 options' });
      }
    }

    const existing = await feedbackModel.getFormByEvent(eventId);
    if (existing) {
      return res.status(409).json({ message: 'A feedback form already exists for this event' });
    }

    const formId = await feedbackModel.createForm({
      eventId, title, description, createdBy: req.user.id, questions,
    });

    res.status(201).json({ message: 'Feedback form created', formId });
  } catch (err) {
    console.error('createForm error:', err);
    res.status(500).json({ message: 'Failed to create feedback form', error: err.message });
  }
}

async function getFormByEvent(req, res) {
  try {
    const form = await feedbackModel.getFormByEvent(req.params.eventId);
    if (!form) return res.json({ form: null });

    let alreadySubmitted = false;
    let myResponse = null;
    let responses = [];

    if (req.user?.role === 'student') {
      myResponse = await feedbackModel.getMyResponse(form.id, req.user.id);
      alreadySubmitted = !!myResponse;
    } else {
      responses = await feedbackModel.getResponsesForForm(form.id);
    }

    res.json({ form, alreadySubmitted, myResponse, responses });
  } catch (err) {
    console.error('getFormByEvent error:', err);
    res.status(500).json({ message: 'Failed to load feedback form', error: err.message });
  }
}

async function getMySubmittedEvents(req, res) {
  try {
    const eventIds = await feedbackModel.getMySubmittedEventIds(req.user.id);
    res.json({ eventIds });
  } catch (err) {
    console.error('getMySubmittedEvents error:', err);
    res.status(500).json({ message: 'Failed to load submitted feedback', error: err.message });
  }
}

async function submitResponse(req, res) {
  try {
    const { formId, eventId, starRating, answers } = req.body;

    if (!formId || !eventId || !starRating) {
      return res.status(400).json({ message: 'formId, eventId, and starRating are required' });
    }
    if (starRating < 1 || starRating > 5) {
      return res.status(400).json({ message: 'starRating must be between 1 and 5' });
    }

    const event = await eventsModel.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    const eventStart = new Date(`${String(event.event_date).slice(0, 10)}T${event.event_time}`);
    if (new Date() < eventStart) {
      return res.status(400).json({ message: 'Feedback opens once the event begins' });
    }

    // Role & Registration Gate: Students must be registered to submit feedback
    if (req.user?.role === 'student') {
      const reg = await registrationsModel.findRegistration(eventId, req.user.id);
      if (!reg) {
        return res.status(403).json({ message: 'You must be registered for this event to leave feedback.' });
      }
    }

    const already = await feedbackModel.hasSubmitted(formId, req.user.id);
    if (already) {
      return res.status(409).json({ message: 'You have already submitted feedback for this event' });
    }

    await feedbackModel.submitResponse({
      formId, eventId, userId: req.user.id, starRating, answers,
    });

    res.status(201).json({ message: 'Feedback submitted' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'You have already submitted feedback for this event' });
    }
    console.error('submitResponse error:', err);
    res.status(500).json({ message: 'Failed to submit feedback', error: err.message });
  }
}

module.exports = { createForm, getFormByEvent, submitResponse, getMySubmittedEvents };