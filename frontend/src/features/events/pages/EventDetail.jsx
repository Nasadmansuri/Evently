import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, User, FileX, Images, MessageSquare } from 'lucide-react';
import api from '../../../shared/services/api';
import { getCategoryStyle } from '../../../shared/utils/categoryColors';

const TABS = ['Details', 'Gallery', 'Feedback'];

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('Details');

  useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      setNotFound(false);
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20">
        <FileX className="text-gray-300 mb-4" size={40} />
        <p className="text-sm font-semibold text-gray-700">This event doesn't exist or has been removed</p>
        <Link to="/events" className="text-xs text-primary-600 font-medium hover:underline mt-2">
          ← Back to All Events
        </Link>
      </div>
    );
  }

  const style = getCategoryStyle(event.category);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-7 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{event.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="text-[11px] font-medium bg-green-50 text-green-700 px-2.5 py-1 rounded-full capitalize">
                {event.status}
              </span>
              <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
                {event.category}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate(`/events/${id}/register`)}
            className="bg-primary-600 hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-200 active:scale-[0.98] text-white font-medium py-2.5 px-5 rounded-lg text-sm transition-all shrink-0"
          >
            Register Now
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1"><Calendar size={11} /> Date</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">
              {new Date(event.event_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1"><Clock size={11} /> Time</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{event.event_time?.slice(0, 5)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1"><MapPin size={11} /> Location</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{event.location}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[11px] text-gray-400 flex items-center gap-1"><User size={11} /> Organizer</p>
            <p className="text-sm font-semibold text-gray-900 mt-0.5">{event.organizing_department}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 sm:flex-none px-5 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-5 sm:p-7">
          {activeTab === 'Details' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1.5">Description</h2>
                <p className="text-sm text-gray-600">{event.description}</p>
              </div>
              {event.rules_eligibility && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-1.5">Rules & Eligibility</h2>
                  <p className="text-sm text-gray-600">{event.rules_eligibility}</p>
                </div>
              )}
              {event.prize_info && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-1.5">Prize Information</h2>
                  <p className="text-sm text-gray-600">{event.prize_info}</p>
                </div>
              )}
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1.5">Event Information</h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between border-b border-gray-50 pb-1.5">
                    <span className="text-gray-500">Maximum Participants</span>
                    <span className="font-medium text-gray-900">{event.max_participants || 'Unlimited'}</span>
                  </div>
                  {event.organizing_community && (
                    <div className="flex justify-between border-b border-gray-50 pb-1.5">
                      <span className="text-gray-500">Community</span>
                      <span className="font-medium text-gray-900">{event.organizing_community}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Created By</span>
                    <span className="font-medium text-gray-900">{event.organizer_name}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Gallery' && (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <Images className="text-gray-300 mb-3" size={28} />
              <p className="text-sm text-gray-500">Gallery coming soon</p>
            </div>
          )}

          {activeTab === 'Feedback' && (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <MessageSquare className="text-gray-300 mb-3" size={28} />
              <p className="text-sm text-gray-500">Feedback isn't open for this event yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}