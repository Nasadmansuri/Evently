import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2, AlertCircle, Loader2, CheckCircle2, FileX } from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';

const QUESTION_TYPES = [
  { value: 'short_text', label: 'Short Text' },
  { value: 'long_text', label: 'Long Text' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
];

function newQuestion() {
  return {
    key: crypto.randomUUID(),
    questionText: '',
    questionType: 'short_text',
    options: ['', ''],
    isRequired: true,
  };
}

export default function FeedbackBuilder() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [existingForm, setExistingForm] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([newQuestion()]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/feedback/forms/event/${eventId}`);
        setExistingForm(res.data.form);
      } catch (err) {
        console.error('Failed to check existing form:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  function updateQuestion(key, patch) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)));
  }

  function updateOption(key, index, value) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.key === key ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) } : q
      )
    );
  }

  function addOption(key) {
    setQuestions((prev) => prev.map((q) => (q.key === key ? { ...q, options: [...q.options, ''] } : q)));
  }

  function removeOption(key, index) {
    setQuestions((prev) =>
      prev.map((q) => (q.key === key ? { ...q, options: q.options.filter((_, i) => i !== index) } : q))
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, newQuestion()]);
  }

  function removeQuestion(key) {
    setQuestions((prev) => prev.filter((q) => q.key !== key));
  }

  function moveQuestion(index, direction) {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Please enter a form title');
    if (questions.length === 0) return setError('Add at least one question');

    for (const q of questions) {
      if (!q.questionText.trim()) return setError('Every question needs question text');
      if (q.questionType === 'multiple_choice') {
        const validOptions = q.options.map((o) => o.trim()).filter(Boolean);
        if (validOptions.length < 2) return setError('Multiple-choice questions need at least 2 options');
      }
    }

    setSubmitting(true);
    try {
      await api.post('/feedback/forms', {
        eventId,
        title,
        description: description || undefined,
        questions: questions.map((q) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          isRequired: q.isRequired,
          options: q.questionType === 'multiple_choice' ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
        })),
      });
      showToast.success('Feedback form created');
      navigate(`/events/${eventId}?tab=feedback`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create feedback form');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="h-64 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  if (existingForm) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-slate-200 bg-white py-16 text-center shadow-sm">
          <CheckCircle2 className="mb-3 text-emerald-500" size={32} />
          <p className="text-sm font-semibold text-slate-700">A feedback form already exists for this event</p>
          <p className="mt-1 text-xs text-slate-400">"{existingForm.title}" — {existingForm.questions.length} question{existingForm.questions.length === 1 ? '' : 's'}</p>
          <Link to={`/events/${eventId}`} className="mt-3 text-xs font-medium text-primary-600 hover:underline">
            ← Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Create Feedback Form</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">Students will be able to submit this after the event.</p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Form Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event Feedback Form"
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell students what this feedback is for..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
          />
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Questions</h2>
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.key} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600">Question {i + 1}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => moveQuestion(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => moveQuestion(i, 1)} disabled={i === questions.length - 1} className="rounded p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-30">↓</button>
                    <button type="button" onClick={() => removeQuestion(q.key)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.key, { questionText: e.target.value })}
                  placeholder="Enter your question..."
                  className="mb-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(q.key, { questionType: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={q.isRequired}
                      onChange={(e) => updateQuestion(q.key, { isRequired: e.target.checked })}
                      className="accent-primary-600"
                    />
                    Required
                  </label>
                </div>

                {q.questionType === 'multiple_choice' && (
                  <div className="mt-3 space-y-1.5">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(q.key, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(q.key, oi)} className="text-slate-400 hover:text-red-500">
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(q.key)}
                      className="text-[11px] font-medium text-primary-600 hover:underline"
                    >
                      + Add option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-medium text-slate-500 transition hover:border-primary-300 hover:text-primary-600"
          >
            <Plus size={15} /> Add Question
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? 'Creating...' : 'Create Feedback Form'}
        </button>
      </form>
    </div>
  );
}