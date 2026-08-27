import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Plus, Trash2, AlertCircle, Loader2, CheckCircle2, FileX, ArrowLeft,
  MessageSquare, HelpCircle, Star, AlignLeft, CheckSquare, ListOrdered, ArrowRight
} from 'lucide-react';
import api from '../../../shared/services/api';
import { showToast } from '../../../shared/utils/toast';
import { fireCelebrationConfetti } from '../../../shared/utils/confetti';

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
    if (questions.length <= 1) {
      showToast.info('A feedback form requires at least one question');
      return;
    }
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

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      if (!q.questionText.trim()) return setError(`Question #${idx + 1} needs question text`);
      if (q.questionType === 'multiple_choice') {
        const validOptions = q.options.map((o) => o.trim()).filter(Boolean);
        if (validOptions.length < 2) return setError(`Question #${idx + 1} (Multiple Choice) needs at least 2 options`);
      }
    }

    setSubmitting(true);
    try {
      await api.post('/feedback/forms', {
        eventId,
        title: title.trim(),
        description: description.trim() || undefined,
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          isRequired: q.isRequired,
          options: q.questionType === 'multiple_choice' ? q.options.map((o) => o.trim()).filter(Boolean) : undefined,
        })),
      });
      fireCelebrationConfetti();
      showToast.success('Feedback form created successfully!');
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
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-2">
          <Link
            to={`/events/${eventId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to Event
          </Link>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Active Feedback Form
              </span>
              <h1 className="text-xl font-bold text-slate-900 mt-1">{existingForm.title}</h1>
              {existingForm.description && (
                <p className="text-xs text-slate-500 mt-0.5">{existingForm.description}</p>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions Included ({existingForm.questions.length})
            </h2>
            {existingForm.questions.map((q, idx) => (
              <div key={q.id || idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">Q{idx + 1}. {q.question_text}</span>
                  <span className="text-[10px] font-semibold text-slate-500 capitalize bg-white px-2 py-0.5 rounded border border-slate-200">
                    {q.question_type.replace('_', ' ')}
                  </span>
                </div>
                {q.options && q.options.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 pl-2">
                    {q.options.map((opt, oi) => (
                      <span key={oi} className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10.5px] text-slate-600">
                        • {opt}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to={`/events/${eventId}?tab=feedback`}
              className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-primary-700 transition"
            >
              <MessageSquare size={15} /> View Feedback Responses
            </Link>
            <Link
              to={`/events/${eventId}`}
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Event Page
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Create Feedback Form</h1>
          <p className="mt-1 text-xs text-slate-500">
            Registered participants can submit feedback once the event begins.
          </p>
        </div>
        <Link
          to={`/events/${eventId}`}
          className="text-xs font-bold text-slate-500 hover:text-slate-900 transition flex items-center gap-1"
        >
          <ArrowLeft size={13} /> Cancel
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-xs text-red-600">
          <AlertCircle size={15} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Form Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Workshop Feedback & Participant Survey"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">Description (Optional)</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief message explaining how participant responses will be used..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Custom Questions ({questions.length})</h2>
            <span className="text-[11px] text-slate-400">Add text, ratings, or choices</span>
          </div>

          <div className="space-y-3.5">
            {questions.map((q, i) => (
              <div key={q.key} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-slate-300 hover:bg-white">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary-800 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md">
                    Question {i + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveQuestion(i, -1)}
                      disabled={i === 0}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-25"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(i, 1)}
                      disabled={i === questions.length - 1}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 disabled:opacity-25"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(q.key)}
                      className="rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition"
                      title="Delete question"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  required
                  value={q.questionText}
                  onChange={(e) => updateQuestion(q.key, { questionText: e.target.value })}
                  placeholder="e.g. What did you enjoy most about this workshop?"
                  className="mb-2.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-900 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={q.questionType}
                    onChange={(e) => updateQuestion(q.key, { questionType: e.target.value })}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    {QUESTION_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>

                  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={q.isRequired}
                      onChange={(e) => updateQuestion(q.key, { isRequired: e.target.checked })}
                      className="rounded accent-primary-600"
                    />
                    Required Question
                  </label>
                </div>

                {q.questionType === 'multiple_choice' && (
                  <div className="mt-3.5 space-y-2 border-t border-slate-200/80 pt-3">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Choice Options</p>
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={opt}
                          onChange={(e) => updateOption(q.key, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
                        />
                        {q.options.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removeOption(q.key, oi)}
                            className="text-slate-400 hover:text-red-500 p-1"
                            title="Remove option"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addOption(q.key)}
                      className="text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1"
                    >
                      + Add another option
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-3 text-xs font-bold text-slate-600 transition hover:border-primary-400 hover:bg-primary-50/50 hover:text-primary-700"
          >
            <Plus size={15} /> Add Another Question
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? 'Creating Form...' : 'Publish Feedback Form'}
        </button>
      </form>
    </div>
  );
}