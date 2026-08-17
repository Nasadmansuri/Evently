import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, CheckCircle2, Loader2, AlertCircle, FileX } from 'lucide-react';
import api from '../../../shared/services/api';

export default function FeedbackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [starRating, setStarRating] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/feedback/forms/event/${id}`);
        setForm(res.data.form);
        setAlreadySubmitted(res.data.alreadySubmitted);
      } catch (err) {
        setError('Failed to load feedback form');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function setAnswer(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (starRating < 1) {
      return setError('Please give an overall star rating');
    }
    const missingRequired = form.questions.find((q) => q.is_required && !answers[q.id]);
    if (missingRequired) {
      return setError(`Please answer: ${missingRequired.question_text}`);
    }

    setSubmitting(true);
    try {
      await api.post('/feedback/responses', {
        formId: form.id,
        eventId: id,
        starRating,
        answers,
      });
      navigate(`/events/${id}?tab=feedback`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
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

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileX className="mb-4 text-slate-300" size={40} />
        <p className="text-sm font-semibold text-slate-700">Feedback isn't open for this event yet</p>
        <Link to={`/events/${id}`} className="mt-2 text-xs font-medium text-primary-600 hover:underline">
          ← Back to Event
        </Link>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <CheckCircle2 className="mb-4 text-emerald-500" size={40} />
        <p className="text-sm font-semibold text-slate-700">Feedback Submitted ✓</p>
        <Link to={`/events/${id}`} className="mt-2 text-xs font-medium text-primary-600 hover:underline">
          ← Back to Event
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{form.title}</h1>
        {form.description && <p className="mt-1 text-sm text-slate-500">{form.description}</p>}
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-900">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStarRating(n)}
                aria-label={`${n} star${n > 1 ? 's' : ''}`}
                className="transition hover:scale-110"
              >
                <Star
                  size={28}
                  className={n <= starRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
              </button>
            ))}
          </div>
        </div>

        {form.questions.map((q) => (
          <div key={q.id}>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
            </label>

            {q.question_type === 'short_text' && (
              <input
                type="text"
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
              />
            )}

            {q.question_type === 'long_text' && (
              <textarea
                rows={3}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswer(q.id, e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
              />
            )}

            {q.question_type === 'rating' && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAnswer(q.id, n)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={22}
                      className={n <= (answers[q.id] || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                    />
                  </button>
                ))}
              </div>
            )}

            {q.question_type === 'multiple_choice' && (
              <div className="space-y-1.5">
                {(q.options || []).map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => setAnswer(q.id, opt)}
                      className="accent-primary-600"
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}