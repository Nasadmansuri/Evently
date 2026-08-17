const pool = require('../../shared/config/db');

async function createForm({ eventId, title, description, createdBy, questions }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [formResult] = await conn.query(
      `INSERT INTO feedback_forms (event_id, title, description, created_by) VALUES (?, ?, ?, ?)`,
      [eventId, title, description || null, createdBy]
    );
    const formId = formResult.insertId;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      await conn.query(
        `INSERT INTO feedback_questions (form_id, question_text, question_type, options_json, is_required, sort_order)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          formId,
          q.questionText,
          q.questionType,
          q.questionType === 'multiple_choice' ? JSON.stringify(q.options || []) : null,
          q.isRequired ? 1 : 0,
          i,
        ]
      );
    }

    await conn.commit();
    return formId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getFormByEvent(eventId) {
  const [forms] = await pool.query(
    `SELECT * FROM feedback_forms WHERE event_id = ? ORDER BY created_at DESC LIMIT 1`,
    [eventId]
  );
  if (forms.length === 0) return null;

  const form = forms[0];
  const [questions] = await pool.query(
    `SELECT id, question_text, question_type, options_json, is_required, sort_order
     FROM feedback_questions WHERE form_id = ? ORDER BY sort_order ASC`,
    [form.id]
  );

  return {
    ...form,
    questions: questions.map((q) => ({
      ...q,
      options: q.options_json ? JSON.parse(q.options_json) : null,
    })),
  };
}

async function hasSubmitted(formId, userId) {
  const [rows] = await pool.query(
    `SELECT id FROM feedback_responses WHERE form_id = ? AND user_id = ?`,
    [formId, userId]
  );
  return rows.length > 0;
}

async function submitResponse({ formId, eventId, userId, starRating, answers }) {
  const [result] = await pool.query(
    `INSERT INTO feedback_responses (form_id, event_id, user_id, star_rating, answers_json)
     VALUES (?, ?, ?, ?, ?)`,
    [formId, eventId, userId, starRating, JSON.stringify(answers || {})]
  );
  return result.insertId;
}

module.exports = { createForm, getFormByEvent, hasSubmitted, submitResponse };