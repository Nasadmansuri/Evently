const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const pool = require('../../shared/config/db');
const eventsModel = require('./events.model');
const registrationsModel = require('../registrations/registrations.model');
const feedbackModel = require('../feedback/feedback.model');
const usersModel = require('../users/users.model');
const notificationsModel = require('../notifications/notifications.model');

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

// async function createEvent(req, res) {
//   try {
//     const {
//       title, description, category, location, eventDate, eventTime,
//       organizingDepartment, organizingCommunity, rulesEligibility,
//       prizeInfo, maxParticipants, isTeamEvent
//     } = req.body;

//     if (!title || !description || !category || !location || !eventDate || !eventTime || !organizingDepartment) {
//       return res.status(400).json({ message: 'Missing required fields' });
//     }

//     const eventId = await eventsModel.createEvent({
//       title, description, category, location, eventDate, eventTime,
//       organizingDepartment, organizingCommunity, rulesEligibility,
//       prizeInfo, maxParticipants, isTeamEvent, userId: req.user.id,
//     });

//     res.status(201).json({ message: 'Event created successfully', eventId });
//   } catch (err) {
//     res.status(500).json({ message: 'Failed to create event', error: err.message });
//   }
// }
async function createEvent(req, res) {
  try {
    const {
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants, isTeamEvent,
      publishType, publishDate, publishTime,
    } = req.body;

    if (!title || !description || !category || !location || !eventDate || !eventTime || !organizingDepartment) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const today = new Date().toISOString().split('T')[0];
    const eventDateOnly = (eventDate || '').slice(0, 10);
    if (eventDateOnly < today) {
      return res.status(400).json({ message: 'Event date cannot be in the past' });
    }

    let publishAt = null;
    if (publishType === 'scheduled' && publishDate && publishTime) {
      const scheduledDateTime = new Date(`${publishDate}T${publishTime}`);
      const eventStartDateTime = new Date(`${eventDateOnly}T${eventTime}`);
      const now = new Date();

      if (isNaN(scheduledDateTime.getTime())) {
        return res.status(400).json({ message: 'Invalid scheduled publish date and time' });
      }
      if (scheduledDateTime <= now) {
        return res.status(400).json({ message: 'Scheduled publish time must be in the future' });
      }
      if (scheduledDateTime > eventStartDateTime) {
        return res.status(400).json({ message: 'Scheduled publish time must be before the event start time' });
      }
      publishAt = `${publishDate} ${publishTime}:00`;
    }

    const eventId = await eventsModel.createEvent({
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants, isTeamEvent, publishAt, userId: req.user.id,
    });

    const isScheduled = !!publishAt;
    res.status(201).json({
      message: isScheduled ? 'Event scheduled successfully' : 'Event created successfully',
      eventId,
      isScheduled,
    });

    // If published immediately, notify all registered students
    if (!isScheduled) {
      pool.query('SELECT id FROM users WHERE role = "student" AND id != ?', [req.user.id])
        .then(([users]) => {
          const userIds = users.map((u) => u.id);
          return notificationsModel.createForUsers(userIds, {
            title: `New Event: ${title}`,
            message: `${organizingDepartment} posted a new ${category} event — check it out!`,
            eventId,
            link: `/events/${eventId}`,
          });
        })
        .catch((err) => console.error('New-event notification broadcast failed:', err.message));
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to create event', error: err.message });
  }
}

async function getAllEvents(req, res) {
  try {
    const { category } = req.query;
    const events = await eventsModel.getAllEvents({ category }, req.user?.id);
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load events', error: err.message });
  }
}

async function getEventById(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user?.id);
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

    const { reason, adminNotes } = req.body || {};
    const deletionReason = reason || adminNotes || (isAdmin ? 'Administrative decision / policy removal' : 'Removed by organizer');

    // 1. Notify the faculty organizer if deleted by Admin or another user
    if (event.created_by) {
      const isSelfDelete = event.created_by === req.user.id;
      if (!isSelfDelete) {
        await notificationsModel.create(event.created_by, {
          title: `Event Removed by Administration: "${event.title}"`,
          message: `Your event "${event.title}" has been removed by campus administration. Reason: ${deletionReason}`,
          eventId: null,
          link: '/faculty/my-events',
        }).catch((err) => console.error('Faculty deletion notification failed:', err.message));
      }
    }

    // 2. Notify all registered students
    const [regs] = await pool.query('SELECT user_id FROM registrations WHERE event_id = ?', [event.id]);
    const studentIds = regs.map((r) => r.user_id).filter((uid) => uid !== req.user.id && uid !== event.created_by);
    if (studentIds.length > 0) {
      await notificationsModel.createForUsers(studentIds, {
        title: `Event Cancelled & Removed: "${event.title}"`,
        message: `Please note that "${event.title}" has been cancelled and removed from the campus schedule. Reason: ${deletionReason}`,
        eventId: null,
        link: '/events',
      }).catch((err) => console.error('Student deletion notification failed:', err.message));
    }

    await eventsModel.deleteEvent(req.params.id);
    res.json({ message: 'Event deleted successfully' });
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

    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled events cannot be edited' });
    }

    const {
      title, description, category, location, eventDate, eventTime,
      organizingDepartment, organizingCommunity, rulesEligibility,
      prizeInfo, maxParticipants, isTeamEvent,
    } = req.body;

    const existingDateStr = event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '';
    const existingTimeStr = event.event_time ? String(event.event_time).slice(0, 5) : '00:00';
    const eventStart = new Date(`${existingDateStr}T${existingTimeStr}:00`);
    const isConcluded = eventStart <= new Date() || event.status === 'ended';

    let finalEventDate = eventDate || event.event_date;
    let finalEventTime = eventTime || event.event_time;

    if (isConcluded) {
      // Concluded events cannot have their historical date/time altered
      finalEventDate = event.event_date;
      finalEventTime = event.event_time;
    } else {
      // Upcoming events cannot be rescheduled into the past
      const incomingDateStr = (eventDate || '').slice(0, 10);
      const incomingTimeStr = (eventTime || '').slice(0, 5) || '00:00';
      if (incomingDateStr) {
        const incomingStart = new Date(`${incomingDateStr}T${incomingTimeStr}:00`);
        if (incomingStart < new Date()) {
          return res.status(400).json({ message: 'Event date and time cannot be scheduled in the past' });
        }
      }
    }

    await eventsModel.updateEvent(req.params.id, {
      title, description, category, location,
      eventDate: finalEventDate,
      eventTime: finalEventTime,
      organizingDepartment, organizingCommunity, rulesEligibility, prizeInfo, maxParticipants, isTeamEvent
    });

    res.json({ message: 'Event updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update event', error: err.message });
  }
}

async function getEventImages(req, res) {
  try {
    const images = await eventsModel.getEventImages(req.params.id);
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load images', error: err.message });
  }
}

async function uploadEventImages(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only add images to events you created' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const imageUrls = req.files.map((f) => `/uploads/events/${f.filename}`);
    await eventsModel.addEventImages(req.params.id, imageUrls);

    const images = await eventsModel.getEventImages(req.params.id);
    res.status(201).json(images);
  } catch (err) {
    res.status(500).json({ message: 'Failed to upload images', error: err.message });
  }
}

async function deleteEventImage(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only delete images from events you created' });
    }

    const image = await eventsModel.getEventImageById(req.params.imageId);
    if (!image || image.event_id !== Number(req.params.id)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await eventsModel.deleteEventImage(req.params.imageId);

    const filePath = path.join(__dirname, '../../../uploads/events', path.basename(image.image_url));
    fs.unlink(filePath, () => {});

    res.json({ message: 'Image deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete image', error: err.message });
  }
}

async function getGallerySummary(req, res) {
  try {
    const summary = await eventsModel.getGallerySummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load gallery', error: err.message });
  }
}

async function setBannerImage(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only set the banner on events you created' });
    }

    const image = await eventsModel.getEventImageById(req.params.imageId);
    if (!image || image.event_id !== Number(req.params.id)) {
      return res.status(404).json({ message: 'Image not found' });
    }

    await eventsModel.setBannerImage(req.params.id, req.params.imageId);
    const images = await eventsModel.getEventImages(req.params.id);
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: 'Failed to set banner image', error: err.message });
  }
}

// ---------- PDF Report Design Tokens ----------
const TEAL = '#035352';
const TEAL_LIGHT = '#E6EFEF';
const BORDER = '#E5E7EB';
const BG_SUBTLE = '#F9FAFB';
const TEXT_DARK = '#111827';
const TEXT_BODY = '#374151';
const TEXT_MUTED = '#6B7280';
const CATEGORY_COLORS = {
  Technical: '#2563EB',
  Hackathon: '#059669',
  Workshop: '#D97706',
  Competition: '#9333EA',
  Cultural: '#E11D48',
  Seminar: '#4F46E5',
  Sports: '#0D9488',
  Conference: '#475569',
  Exhibition: '#0891B2',
  'Social & Networking': '#7C3AED',
};
const SLATE = '#334155';
const CARD_BORDER = '#E4E4E7';

// ---------- PDF Report Layout Helpers ----------
function ensureSpace(doc, y, needed) {
  const bottom = doc.page.height - doc.page.margins.bottom;
  if (y + needed > bottom) {
    doc.addPage();
    return doc.page.margins.top;
  }
  return y;
}

function drawPill(doc, text, x, y, { bg, color, fontSize = 8, paddingX = 8, paddingY = 4 }) {
  doc.font('Helvetica-Bold').fontSize(fontSize);
  const w = doc.widthOfString(text) + paddingX * 2;
  const h = fontSize + paddingY * 2;
  doc.roundedRect(x, y, w, h, h / 2).fill(bg);
  doc.fillColor(color).text(text, x + paddingX, y + paddingY - 0.5);
  return w;
}

function formatTime12hr(timeString) {
  if (!timeString) return '—';
  const [hourStr, minute] = timeString.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${minute} ${ampm}`;
}

function drawSectionLabel(doc, label, x, y, width) {
  doc.font('Helvetica-Bold').fontSize(12).fillColor(SLATE)
    .text(label, x, y);
  return y + 18;
}

function drawHeader(doc, event, reportId, left, right) {
  const ASSETS_DIR = path.join(__dirname, '../../assets');
  const ICON_PATH = path.join(ASSETS_DIR, 'evently-icon.png');
  const BIC_LOGO_PATH = path.join(ASSETS_DIR, 'bic-ing-logo.png');
  const hasIcon = fs.existsSync(ICON_PATH);
  const hasBicLogo = fs.existsSync(BIC_LOGO_PATH);

  let y = doc.page.margins.top;

  // Left: Evently wordmark
  if (hasIcon) {
    try { doc.image(ICON_PATH, left, y + 4, { width: 26, height: 26 }); } catch (e) {}
  }
  doc.font('Helvetica-Bold').fontSize(15).fillColor(TEAL)
    .text('Evently', left + (hasIcon ? 34 : 0), y + 9);

  // Right: college logo only — no meta box, so the header stays short
  let rightBlockBottom = y;
  if (hasBicLogo) {
    const logoH = 44;
    const logoW = 135;
    try {
      doc.image(BIC_LOGO_PATH, right - logoW, y, { fit: [logoW, logoH], align: 'right' });
    } catch (e) {}
    rightBlockBottom = y + logoH;
  }

  const leftBlockBottom = y + 9 + 20;
  y = Math.max(leftBlockBottom, rightBlockBottom) + 10;

  // Bold divider under the logo row, above the centered title
  doc.moveTo(left, y).lineTo(right, y).lineWidth(2).strokeColor('#111827').stroke();
  y += 14;

  doc.font('Helvetica-Bold').fontSize(19).fillColor(TEXT_DARK)
    .text(event.title, left, y, { width: right - left, align: 'center' });
  const titleBottom = doc.y;

  return titleBottom + 14;
}

function drawMetaGrid(doc, items, x, y, width) {
  const cols = 3;
  const gap = 10;
  const colWidth = (width - gap * (cols - 1)) / cols;
  const pad = 10;
  const rows = Math.ceil(items.length / cols);

  // Measure each row's real height first — a wrapped 2-line value needs more
  // room than a single-line one, so rows are no longer a fixed height.
  const rowHeights = [];
  for (let r = 0; r < rows; r++) {
    let maxValueH = 0;
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= items.length) continue;
      const item = items[idx];
      const dotSpace = item.badgeColor ? 12 : 0;
      const valueWidth = colWidth - pad - dotSpace;
      doc.font(item.badgeColor ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      const h = doc.heightOfString(String(item.value ?? '—'), { width: valueWidth });
      maxValueH = Math.max(maxValueH, h);
    }
    rowHeights.push(Math.max(29, 12 + maxValueH + 6));
  }
  const boxH = pad * 2 + rowHeights.reduce((a, b) => a + b, 0);

  doc.roundedRect(x, y, width, boxH, 6).fillColor(BG_SUBTLE).fill();
  doc.roundedRect(x, y, width, boxH, 6).lineWidth(0.75).strokeColor(BORDER).stroke();

  const rowOffsets = [0];
  for (let r = 0; r < rowHeights.length; r++) rowOffsets.push(rowOffsets[r] + rowHeights[r]);

  items.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = x + pad + col * (colWidth + gap);
    const cy = y + pad + rowOffsets[row];
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(TEXT_MUTED)
      .text(item.label.toUpperCase(), cx, cy, { width: colWidth, characterSpacing: 0.3 });

    if (item.badgeColor) {
      const dotR = 3;
      const dotX = cx + dotR;
      const dotY = cy + 12 + 4.5;
      doc.circle(dotX, dotY, dotR).fill(item.badgeColor);
      doc.font('Helvetica-Bold').fontSize(10).fillColor(item.badgeColor)
        .text(String(item.value ?? '—'), cx + dotR * 2 + 6, cy + 12, { width: colWidth - dotR * 2 - 6 - pad });
    } else {
      doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK)
        .text(String(item.value ?? '—'), cx, cy + 12, { width: colWidth - pad });
    }
  });

  return y + boxH + 14;
}

function drawKpiCards(doc, cards, x, y, width) {
  const gap = 12;
  const cardW = (width - gap * (cards.length - 1)) / cards.length;
  const cardH = 56;

  cards.forEach((card, i) => {
    const cx = x + i * (cardW + gap);
    doc.roundedRect(cx, y, cardW, cardH, 8).fillColor('#FFFFFF').fill();
    doc.roundedRect(cx, y, cardW, cardH, 8).lineWidth(0.75).strokeColor(CARD_BORDER).stroke();

    doc.font('Helvetica-Bold').fontSize(20).fillColor(TEAL)
      .text(card.value, cx + 12, y + 13, { width: cardW - 24 });
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(TEXT_MUTED)
      .text(card.label.toUpperCase(), cx + 12, y + 39, { width: cardW - 24, characterSpacing: 0.3 });
  });

  return y + cardH + 14;
}

function drawParticipantsTable(doc, participants, x, yStart, width, isTeamEvent) {
  const columns = isTeamEvent
    ? [
        { key: 'idx', label: '#', width: 18 },
        { key: 'name', label: 'Name', width: 76 },
        { key: 'contact', label: 'Email & Phone', width: 108 },
        { key: 'college', label: 'College / Major', width: 82 },
        { key: 'sem', label: 'Semester & Group', width: 78 },
        { key: 'team', label: 'Team', width: 78 },
        { key: 'date', label: 'Registered', width: 72 },
      ]
    : [
        { key: 'idx', label: '#', width: 22 },
        { key: 'name', label: 'Name', width: 86 },
        { key: 'contact', label: 'Email & Phone', width: 128 },
        { key: 'college', label: 'College / Major', width: 100 },
        { key: 'sem', label: 'Semester & Group', width: 94 },
        { key: 'date', label: 'Registered', width: 82 },
      ];
  const pad = 6;
  const headerH = 22;

  function drawTableHeader(y) {
    doc.rect(x, y, width, headerH).fillColor(TEAL).fill();
    let cx = x;
    columns.forEach((col) => {
      doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#FFFFFF')
        .text(col.label.toUpperCase(), cx + pad, y + 7, { width: col.width - pad * 2, characterSpacing: 0.3 });
      cx += col.width;
    });
    return y + headerH;
  }

  let y = ensureSpace(doc, yStart, headerH + 30);
  y = drawTableHeader(y);

  if (participants.length === 0) {
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_MUTED)
      .text('No registrations yet.', x + pad, y + 8);
    return y + 26;
  }

  participants.forEach((p, i) => {
    const isBic = !!p.course_name;
    const collegeCol = isBic
      ? (p.sp_college_name || '—')
      : ([p.gp_college_name, p.course_major].filter(Boolean).join(' — ') || '—');
    const semCol = isBic
      ? ([p.course_name, p.academic_level && `L${p.academic_level}`, p.academic_semester && `S${p.academic_semester}`, p.academic_group]
          .filter(Boolean).join(' · ') || '—')
      : '—';
    const contactCol = `${p.email}\n${p.phone || '—'}`;
    const dateCol = new Date(p.registered_at).toLocaleDateString();
    const teamCol = p.team_members || '—';
    const cellValues = { idx: String(i + 1), name: p.full_name, contact: contactCol, college: collegeCol, sem: semCol, team: teamCol, date: dateCol };

    doc.font('Helvetica').fontSize(8.5);
    let maxLines = 1;
    columns.forEach((col) => {
      const h = doc.heightOfString(cellValues[col.key], { width: col.width - pad * 2 });
      maxLines = Math.max(maxLines, Math.ceil(h / 10));
    });
    const rowH = Math.max(26, maxLines * 10 + pad * 2);

    const before = y;
    y = ensureSpace(doc, y, rowH);
    if (y !== before) y = drawTableHeader(y);

    if (i % 2 === 1) {
      doc.rect(x, y, width, rowH).fillColor(BG_SUBTLE).fill();
    }

    let cx = x;
    columns.forEach((col) => {
      doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_BODY)
        .text(cellValues[col.key], cx + pad, y + pad, { width: col.width - pad * 2 });
      cx += col.width;
    });

    doc.moveTo(x, y + rowH).lineTo(x + width, y + rowH).lineWidth(0.5).strokeColor(BORDER).stroke();
    y += rowH;
  });

  return y + 10;
}

function drawFeedbackSection(doc, form, responses, x, y, width) {
  const avgRating = (responses.reduce((s, r) => s + r.star_rating, 0) / responses.length).toFixed(1);
  y = drawKpiCards(doc, [
    { label: 'Responses', value: String(responses.length) },
    { label: 'Average Rating', value: `${avgRating} / 5` },
  ], x, y, width);

  responses.forEach((r) => {
    const answered = form.questions.filter((q) => {
      const a = r.answers[q.id];
      return a !== undefined && a !== null && a !== '';
    });
    const cardPad = 10;
    doc.font('Helvetica').fontSize(9);
    let contentH = 34;
    answered.forEach((q) => {
      const a = r.answers[q.id];
      contentH += doc.heightOfString(`Q: ${q.question_text}`, { width: width - cardPad * 2 }) + 2;
      contentH += doc.heightOfString(`A: ${a}`, { width: width - cardPad * 2 }) + 6;
    });
    const cardH = contentH + cardPad * 2;

    y = ensureSpace(doc, y, cardH + 10);

    doc.roundedRect(x, y, width, cardH, 6).fillColor('#FFFFFF').fill();
    doc.roundedRect(x, y, width, cardH, 6).lineWidth(0.75).strokeColor(BORDER).stroke();

    let cy = y + cardPad;
    doc.font('Helvetica-Bold').fontSize(10).fillColor(TEXT_DARK)
      .text(r.full_name, x + cardPad, cy, { continued: true, width: width - cardPad * 2 - 60 });
    doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
      .text(`   ${new Date(r.submitted_at).toLocaleDateString()}`);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEAL)
      .text(`${r.star_rating}/5`, x + width - cardPad - 30, y + cardPad, { width: 30, align: 'right' });
    cy += 16;

    answered.forEach((q) => {
      doc.font('Helvetica-Bold').fontSize(8.5).fillColor(TEXT_BODY)
        .text(`Q: ${q.question_text}`, x + cardPad, cy, { width: width - cardPad * 2 });
      cy = doc.y + 2;
      doc.font('Helvetica').fontSize(8.5).fillColor(TEXT_BODY)
        .text(`A: ${r.answers[q.id]}`, x + cardPad, cy, { width: width - cardPad * 2 });
      cy = doc.y + 6;
    });

    y += cardH + 10;
  });

  return y;
}

function drawFooters(doc, left, right, generatedAt, reportId) {
  const range = doc.bufferedPageRange();
  const total = range.count;
  for (let i = range.start; i < range.start + total; i++) {
    doc.switchToPage(i);
    const footerY = doc.page.height - 34;
    doc.moveTo(left, footerY).lineTo(right, footerY).lineWidth(0.5).strokeColor(BORDER).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor(TEXT_MUTED)
      .text(`${reportId}  ·  Generated ${generatedAt}`, left, footerY + 6, { width: (right - left) / 2, align: 'left' });
    doc.text(`Page ${i - range.start + 1} of ${total}`, left + (right - left) / 2, footerY + 6, { width: (right - left) / 2, align: 'right' });
  }
}

// ---------- Main Report Handler ----------
async function generateReport(req, res) {
  try {
    const event = await eventsModel.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only generate reports for events you organized' });
    }

    const [participants, images, form] = await Promise.all([
      registrationsModel.getEventParticipants(req.params.id),
      eventsModel.getEventImages(req.params.id),
      feedbackModel.getFormByEvent(req.params.id),
    ]);
    const responses = form ? await feedbackModel.getResponsesForForm(form.id) : [];

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="event-report-${event.id}.pdf"`);
    doc.pipe(res);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const contentWidth = right - left;
    const generatedAt = new Date().toLocaleString();
    const reportId = `RPT-${String(event.id).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`;

    let y = drawHeader(doc, event, reportId, left, right);

    y = drawSectionLabel(doc, 'Event Overview', left, y, contentWidth);
    y = drawMetaGrid(doc, [
      { label: 'Date', value: new Date(event.event_date).toLocaleDateString() },
      { label: 'Time', value: formatTime12hr(event.event_time) },
      { label: 'Location', value: event.location },
      { label: 'Category', value: event.category, badgeColor: CATEGORY_COLORS[event.category] || TEXT_MUTED },
      { label: 'Organizing Dept', value: event.organizing_department },
      ...(event.organizing_community ? [{ label: 'Community', value: event.organizing_community }] : []),
      { label: 'Organized By', value: event.organizer_name },
      { label: 'Max Participants', value: event.max_participants || 'Unlimited' },
    ], left, y, contentWidth);

    doc.font('Helvetica-Bold').fontSize(9).fillColor(TEXT_DARK).text('Description', left, y);
    y = doc.y + 4;
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_BODY)
      .text(event.description || '—', left, y, { width: contentWidth, lineGap: 3 });
    y = doc.y + 14;

    if (event.rules_eligibility) {
      y = ensureSpace(doc, y, 50);
      y = drawSectionLabel(doc, 'Rules & Guidelines', left, y, contentWidth);
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_BODY)
        .text(event.rules_eligibility, left, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 14;
    }

    if (event.prize_info) {
      y = ensureSpace(doc, y, 50);
      y = drawSectionLabel(doc, 'Prizes & Awards', left, y, contentWidth);
      doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_BODY)
        .text(event.prize_info, left, y, { width: contentWidth, lineGap: 3 });
      y = doc.y + 14;
    }

    if (images.length > 0) {
      const cols = 3;
      const gap = 10;
      const imgWidth = (contentWidth - gap * (cols - 1)) / cols;
      const imgHeight = imgWidth * 1.15;
      const galleryMinFirstRow = 18 + (imgHeight + gap);

      y = ensureSpace(doc, y, galleryMinFirstRow);
      y = drawSectionLabel(doc, 'Event Gallery', left, y, contentWidth);

      let x = left;
      let col = 0;

      for (const img of images) {
        const filePath = path.join(__dirname, '../../../uploads/events', path.basename(img.image_url));
        if (!fs.existsSync(filePath)) continue;
        if (col === cols) { col = 0; x = left; y += imgHeight + gap; }
        const before = y;
        y = ensureSpace(doc, y, imgHeight);
        if (y !== before) { x = left; col = 0; }
        try {
          doc.roundedRect(x, y, imgWidth, imgHeight, 4).lineWidth(0.75).strokeColor(BORDER).stroke();
          doc.image(filePath, x + 2, y + 2, { fit: [imgWidth - 4, imgHeight - 4], align: 'center', valign: 'center' });
        } catch (e) {}
        x += imgWidth + gap;
        col++;
      }
      y += imgHeight + gap + 6;
    }

    y = ensureSpace(doc, y, 18 + 56 + 14);
    y = drawSectionLabel(doc, 'Participation Statistics', left, y, contentWidth);

    const attendanceRate = event.max_participants
      ? `${Math.round((participants.length / event.max_participants) * 100)}%`
      : 'N/A';

    y = drawKpiCards(doc, [
      { label: 'Total Registrations', value: String(participants.length) },
      { label: 'Max Capacity', value: event.max_participants ? String(event.max_participants) : 'Unlimited' },
      { label: 'Registration Rate', value: attendanceRate },
      { label: 'Feedback Received', value: String(responses.length) },
    ], left, y, contentWidth);

    y = ensureSpace(doc, y, 18 + 22 + 30);
    y = drawSectionLabel(doc, 'Registered Participants', left, y, contentWidth);
    y = drawParticipantsTable(doc, participants, left, y, contentWidth, !!event.is_team_event);

    if (form && responses.length > 0) {
      y = ensureSpace(doc, y, 80);
      y = drawSectionLabel(doc, 'Feedback Summary', left, y, contentWidth);
      y = drawFeedbackSection(doc, form, responses, left, y, contentWidth);
    }

    drawFooters(doc, left, right, generatedAt, reportId);
    doc.end();
  } catch (err) {
    console.error('generateReport error:', err);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to generate report', error: err.message });
    }
  }
}

async function createDeletionRequest(req, res) {
  try {
    const { id } = req.params;
    const { reasonCategory, problemStatement } = req.body;

    if (!reasonCategory || !problemStatement || !problemStatement.trim()) {
      return res.status(400).json({ message: 'Reason category and problem statement are required' });
    }

    const event = await eventsModel.getEventById(id, req.user.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const isOwner = event.created_by === req.user.id;
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'You can only request deletion for events you created' });
    }

    if (event.deletion_request_id) {
      return res.status(409).json({ message: 'A deletion request for this event is already pending administration review' });
    }

    const requestId = await eventsModel.createDeletionRequest({
      eventId: id,
      userId: req.user.id,
      reasonCategory: reasonCategory.trim(),
      problemStatement: problemStatement.trim(),
    });

    // Notify administrators
    pool.query('SELECT id FROM users WHERE role = "admin"')
      .then(([admins]) => {
        const adminIds = admins.map((a) => a.id);
        if (adminIds.length > 0) {
          return notificationsModel.createForUsers(adminIds, {
            title: `Event Deletion Request: ${event.title}`,
            message: `${req.user.full_name || 'Faculty organizer'} submitted a deletion request for "${event.title}". Reason: ${reasonCategory}.`,
            eventId: event.id,
            link: `/events/${event.id}`,
          });
        }
      })
      .catch((err) => console.error('Admin deletion request notification failed:', err.message));

    res.status(201).json({
      message: 'Deletion request submitted successfully. Administration has been notified for review.',
      requestId,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to submit deletion request', error: err.message });
  }
}

async function getDeletionRequests(req, res) {
  try {
    const { status } = req.query;
    const requests = await eventsModel.getDeletionRequests({ status });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Failed to load deletion requests', error: err.message });
  }
}

async function resolveDeletionRequest(req, res) {
  try {
    const { requestId } = req.params;
    let { status, approved, adminNotes } = req.body;

    if (approved !== undefined && !status) {
      status = approved ? 'approved' : 'rejected';
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const resolved = await eventsModel.resolveDeletionRequest(requestId, {
      status,
      adminNotes,
      adminId: req.user.id,
    });

    if (!resolved) {
      return res.status(404).json({ message: 'Deletion request not found' });
    }

    const facultyRecipients = Array.from(new Set([resolved.requested_by, resolved.event_owner_id].filter(Boolean)));

    if (status === 'approved') {
      const reasonText = resolved.reason_category + (adminNotes ? ` — ${adminNotes}` : (resolved.problem_statement ? ` — ${resolved.problem_statement}` : ''));

      // Soft-delete: mark event as cancelled and document official cancellation reason
      await pool.query(
        `UPDATE events SET status = 'cancelled', cancellation_reason = ?, cancelled_at = NOW() WHERE id = ?`,
        [reasonText, resolved.event_id]
      );

      for (const fId of facultyRecipients) {
        await notificationsModel.create(fId, {
          title: `Event Cancellation Approved: "${resolved.event_title}"`,
          message: `Your request to cancel "${resolved.event_title}" has been approved by administration. Note: ${adminNotes || 'Approved'}. The event is now officially marked as Cancelled.`,
          eventId: resolved.event_id,
          link: '/faculty/my-events',
        }).catch((err) => console.error('Faculty cancellation notification failed:', err.message));
      }

      pool.query('SELECT user_id FROM registrations WHERE event_id = ?', [resolved.event_id])
        .then(([regs]) => {
          const studentIds = regs.map((r) => r.user_id).filter((uid) => !facultyRecipients.includes(uid));
          if (studentIds.length > 0) {
            return notificationsModel.createForUsers(studentIds, {
              title: `Event Cancelled: ${resolved.event_title}`,
              message: `Please be advised that "${resolved.event_title}" has been cancelled by administration. Reason: ${resolved.reason_category}.`,
              eventId: resolved.event_id,
              link: `/events/${resolved.event_id}`,
            });
          }
        })
        .catch((err) => console.error('Student cancellation notification failed:', err.message));

      res.json({ message: 'Deletion request approved. Event has been marked as cancelled with the reason preserved.' });
    } else {
      for (const fId of facultyRecipients) {
        await notificationsModel.create(fId, {
          title: `Event Deletion Request Declined: "${resolved.event_title}"`,
          message: `Your request to delete "${resolved.event_title}" was not approved by administration. Administration Note: ${adminNotes || 'Please contact administration for details.'}`,
          eventId: resolved.event_id,
          link: '/faculty/my-events',
        }).catch((err) => console.error('Faculty decline notification failed:', err.message));
      }

      res.json({ message: 'Deletion request rejected. Requester has been notified.' });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to resolve deletion request', error: err.message });
  }
}

module.exports = {
  getMyEvents, getMyStats, createEvent, getAllEvents, getEventById, getRecommended,
  getAllEventsAdmin, deleteEvent, getAdminStats, updateEvent,
  getEventImages, uploadEventImages, deleteEventImage, getGallerySummary,
  setBannerImage, generateReport,
  createDeletionRequest, getDeletionRequests, resolveDeletionRequest,
};
