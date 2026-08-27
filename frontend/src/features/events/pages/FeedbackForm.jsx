import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, CheckCircle2, Loader2, AlertCircle, FileX, ArrowLeft,
  Calendar, MapPin, Sparkles, MessageSquare, Send, Award, Clock,
  ChevronRight, Quote, ThumbsUp, Tag
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../../../shared/services/api';
import { formatTime12hr } from '../../../shared/utils/formatTime';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';
import { showToast } from '../../../shared/utils/toast';
import { fireCelebrationConfetti } from '../../../shared/utils/confetti';

const RATING_DESCRIPTIONS = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good / Met Expectations',
  4: 'Very Good / Enjoyable',
  5: 'Exceptional & Inspiring',
};

export default function FeedbackForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [myResponse, setMyResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [starRating, setStarRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [formRes, eventRes] = await Promise.all([
          api.get(`/feedback/forms/event/${id}`),
          api.get(`/events/${id}`).catch(() => ({ data: null })),
        ]);

        setForm(formRes.data.form);
        setAlreadySubmitted(formRes.data.alreadySubmitted);
        setMyResponse(formRes.data.myResponse);
        if (eventRes?.data) setEvent(eventRes.data);
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
      return setError('Please provide an overall star rating (1 to 5 stars)');
    }
    const missingRequired = form.questions.find((q) => q.is_required && !answers[q.id]);
    if (missingRequired) {
      return setError(`Please answer: "${missingRequired.question_text}"`);
    }

    setSubmitting(true);
    try {
      await api.post('/feedback/responses', {
        formId: form.id,
        eventId: id,
        starRating,
        answers,
      });
      fireCelebrationConfetti();
      showToast.success('Feedback submitted successfully! Thank you.');
      navigate(`/events/${id}?tab=feedback`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <div className="h-64 animate-pulse rounded-[24px] border border-slate-200 bg-slate-100" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FileX size={28} />
        </div>
        <h2 className="text-base font-bold text-slate-800">Feedback Not Available</h2>
        <p className="mt-1 text-xs text-slate-500">
          The organizer has not published a feedback form for this event yet.
        </p>
        <div className="mt-5">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <ArrowLeft size={14} /> Back to Event Details
          </button>
        </div>
      </div>
    );
  }

  const categoryStyle = event ? getCategoryStyle(event.category) : null;
  const currentRatingDesc = RATING_DESCRIPTIONS[hoverRating || starRating] || 'Click on a star to rate';

  // --------------------------------------------------------------------------
  // ALREADY SUBMITTED REVIEW STATE (Clean, Editorial, High-End Card)
  // --------------------------------------------------------------------------
  if (alreadySubmitted) {
    const submittedRating = myResponse?.star_rating || 0;
    const submittedDesc = RATING_DESCRIPTIONS[submittedRating] || `${submittedRating} Stars`;

    return (
      <div className="mx-auto max-w-2xl pb-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft size={14} /> Back to Event
          </button>
          <span className="text-[11px] font-medium text-slate-400">
            {event?.title || 'Event Feedback'}
          </span>
        </div>

        {/* Hero Header Card */}
        <div className="relative mb-5 overflow-hidden rounded-[24px] bg-[#023433] p-6 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
          <div className="relative z-10">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {categoryStyle && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text}`}>
                    {event.category}
                  </span>
                )}
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 size={11} /> Feedback Submitted
                </span>
              </div>
              <span className="text-[11px] text-emerald-100/70">
                {myResponse?.created_at ? new Date(myResponse.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Response'}
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {event?.title || form.title || 'Event Feedback'}
            </h1>
            <p className="mt-1 text-xs text-emerald-100/80 line-clamp-1">
              Thank you for sharing your perspective. Your response helps improve future campus events.
            </p>
          </div>
        </div>

        {/* Overall Rating Scorecard */}
        <div className="mb-5 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Your Overall Rating</p>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={26}
                      className={
                        n <= submittedRating
                          ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                          : 'fill-slate-100 text-slate-200'
                      }
                    />
                  ))}
                </div>
                <span className="text-xl font-black text-slate-900 ml-1">
                  {submittedRating}.0
                </span>
                <span className="text-xs text-slate-400 font-medium">/ 5.0</span>
              </div>
            </div>

            <div className="self-start sm:self-auto rounded-xl bg-amber-50 border border-amber-200/60 px-3.5 py-2 text-xs font-bold text-amber-800 flex items-center gap-1.5">
              <Award size={15} className="text-amber-600" />
              <span>{submittedDesc}</span>
            </div>
          </div>

          {/* Detailed Question Answers */}
          <div className="pt-5 space-y-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Detailed Answers</p>

            {form.questions.map((q, idx) => {
              const answer = myResponse?.answers?.[q.id];
              return (
                <div
                  key={q.id}
                  className="rounded-[18px] border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{q.question_text}</p>

                      <div className="mt-2.5">
                        {q.question_type === 'rating' ? (
                          <div className="flex items-center gap-1 bg-white inline-flex px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={18}
                                className={
                                  n <= Number(answer || 0)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-100 text-slate-200'
                                }
                              />
                            ))}
                            <span className="ml-2 text-xs font-bold text-slate-700">
                              {answer ? `${answer} / 5` : 'Not rated'}
                            </span>
                          </div>
                        ) : q.question_type === 'multiple_choice' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-50 border border-primary-200 px-3.5 py-2 text-xs font-bold text-primary-800 shadow-2xs">
                            <CheckCircle2 size={13} className="text-primary-600 shrink-0" />
                            {answer || '—'}
                          </span>
                        ) : q.question_type === 'long_text' ? (
                          <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs">
                            <p className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                              {answer || 'No response provided'}
                            </p>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 shadow-2xs">
                            <MessageSquare size={14} className="text-primary-600 shrink-0" />
                            <span className="text-sm font-semibold text-slate-800">{answer || 'No response provided'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => navigate(`/events/${id}`)}
            className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 active:scale-[0.98]"
          >
            <ArrowLeft size={15} /> Return to Event Details
          </button>
          <button
            onClick={() => navigate('/student/my-feedback')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98]"
          >
            View All Feedback Submissions
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // FEEDBACK FORM INPUT STATE (Interactive, Clean, Modern UX)
  // --------------------------------------------------------------------------
  return (
    <div className="mx-auto max-w-2xl pb-10">
      {/* Navigation Breadcrumb */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(`/events/${id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft size={14} /> Back to Event
        </button>
        <span className="text-[11px] font-medium text-slate-400">Participant Feedback</span>
      </div>

      {/* Hero Header Card */}
      <div className="relative mb-5 overflow-hidden rounded-[24px] bg-[#023433] p-6 text-white shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              {categoryStyle && (
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${categoryStyle.bg} ${categoryStyle.text}`}>
                  {event.category}
                </span>
              )}
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                Official Feedback
              </span>
            </div>
            {event && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-100/70">
                <Clock size={12} /> ~2 min completion
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {event?.title ? `Feedback: ${event.title}` : form.title}
          </h1>
          <p className="mt-1 text-xs text-emerald-100/80 leading-relaxed">
            {form.description || 'Your honest feedback helps organizers improve future campus activities.'}
          </p>

          {event && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-emerald-100/70 border-t border-white/10 pt-3">
              <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.event_date).toLocaleDateString()}</span>
              {event.location && <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>}
              {event.organizing_department && <span>· {event.organizing_department}</span>}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 shadow-2xs">
          <AlertCircle size={16} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Overall Rating Section */}
        <div className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
          <label className="block text-sm font-bold text-slate-900 mb-1">
            Overall Experience Rating <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500 mb-4">
            How would you rate this event overall?
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-50/80 border border-slate-100 p-4">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStarRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className="rounded-lg p-1 transition-all duration-150 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  <Star
                    size={32}
                    className={
                      n <= (hoverRating || starRating)
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'fill-slate-200 text-slate-300'
                    }
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-slate-700 rounded-xl bg-white px-3 py-1.5 border border-slate-200/80 shadow-2xs">
              {currentRatingDesc}
            </div>
          </div>
        </div>

        {/* Detailed Questions */}
        {form.questions.map((q, idx) => (
          <div
            key={q.id}
            className="rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6 space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[11px] font-bold text-primary-800">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-900">
                  {q.question_text} {q.is_required && <span className="text-red-500">*</span>}
                </label>
                {q.is_required && (
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                    Required
                  </span>
                )}
              </div>
            </div>

            <div className="pt-1">
              {q.question_type === 'short_text' && (
                <input
                  type="text"
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              )}

              {q.question_type === 'long_text' && (
                <textarea
                  rows={3}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswer(q.id, e.target.value)}
                  placeholder="Share your detailed feedback or suggestions..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-900 transition focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              )}

              {q.question_type === 'rating' && (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50/70 border border-slate-100 p-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n)}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      className="p-1 transition hover:scale-125 focus:outline-none"
                    >
                      <Star
                        size={26}
                        className={
                          n <= (answers[q.id] || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-slate-200 text-slate-300'
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-xs font-semibold text-slate-600">
                    {answers[q.id] ? `${answers[q.id]} / 5` : 'Select score'}
                  </span>
                </div>
              )}

              {q.question_type === 'multiple_choice' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(q.options || []).map((opt) => {
                    const isSelected = answers[q.id] === opt;
                    return (
                      <label
                        key={opt}
                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-xs font-semibold transition ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-2xs'
                            : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100/70'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => setAnswer(q.id, opt)}
                          className="accent-primary-600"
                        />
                        <span>{opt}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-700 py-3 text-sm font-bold text-white shadow-md shadow-primary-700/20 transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            {submitting ? 'Submitting Feedback...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </div>
  );
}