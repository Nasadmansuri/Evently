import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, Mail, Phone, MapPin, ChevronDown, CheckCircle2, AlertCircle, Loader2, ExternalLink, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

function InstagramIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

function FacebookIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  );
}

function LinkedinIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect width="4" height="12" x="2" y="9"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}

const USER_TYPES = [
  'Student',
  'Company / Recruiter',
  'Institute / College',
  'Other'
];

const QUICK_TOPICS = [
  { label: 'Partnerships', subject: 'Partnership & Collaboration Inquiry' },
  { label: 'Feedback', subject: 'Platform & Event Feedback' },
  { label: 'Support', subject: 'Technical Support Request' },
];

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mzebbobl';

export default function LandingContact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    userType: '',
    subject: '',
    message: ''
  });
  const [activeTag, setActiveTag] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectUserType = (type) => {
    setFormData((prev) => ({ ...prev, userType: type }));
    setDropdownOpen(false);
  };

  const handleQuickTopic = (topic) => {
    if (activeTag === topic.label) {
      setActiveTag('');
      setFormData((prev) => ({ ...prev, subject: '' }));
    } else {
      setActiveTag(topic.label);
      setFormData((prev) => ({ ...prev, subject: topic.subject }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!formData.message.trim()) {
      toast.error('Please enter your message');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || 'Not provided',
          userType: formData.userType || 'Unspecified',
          subject: formData.subject,
          message: formData.message,
          _replyto: formData.email
        })
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success('Your message has been sent successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          userType: '',
          subject: '',
          message: ''
        });
        setActiveTag('');
      } else {
        if (data && data.errors && data.errors.length > 0) {
          const errMsg = data.errors.map(err => err.message).join(', ');
          setErrorMessage(errMsg);
          toast.error(errMsg);
        } else {
          setErrorMessage('Failed to send message. Please try again later.');
          toast.error('Failed to send message.');
        }
      }
    } catch (err) {
      console.error('Contact form submission error:', err);
      setErrorMessage('Network error occurred. Please check your connection and try again.');
      toast.error('Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-[#edf0f5]/60 relative overflow-hidden">
      <div className="mx-auto max-w-[1480px] px-6 sm:px-10 md:px-12">
        {/* Section Header Badge */}
        <div className="mb-6 text-left">
          <span className="rounded-full bg-purple-50 px-3.5 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-purple-600 border border-purple-100 shadow-2xs">
            GET IN TOUCH
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
            Connect with <span className="text-[#7c3aed]">Evently & BIC.</span>
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium max-w-xl">
            Have questions about upcoming campus events, DevCorps communities, or registrations? We're here to assist you.
          </p>
        </div>

        {/* 2-Column Responsive Grid Perfectly Balanced & Fitted */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 xl:gap-8 items-stretch">
          
          {/* Left Column: Send a Message Form Card */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-[32px] p-6 sm:p-8 md:p-9 border border-slate-200/80 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[540px]">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-100/40 blur-3xl" />

            <div className="flex-1 flex flex-col justify-between">
              {/* Header: Dark Circle Icon + Title */}
              <div className="flex items-center gap-3.5 mb-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0B0F19] text-white shadow-md">
                  <Send size={18} className="-rotate-12 translate-x-0.5" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900 leading-none">
                    Send a message
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-1">
                    We usually respond within 24 hours
                  </p>
                </div>
              </div>

              {/* Success Dedicated Card (Replaces Form to Keep Height Stable & Clean) */}
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="my-auto py-8 text-center flex flex-col items-center justify-center"
                  >
                    <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 shadow-inner">
                      <CheckCircle2 size={36} />
                    </div>
                    <h4 className="text-xl font-black text-slate-900">Message Delivered!</h4>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                      Thank you for contacting us. Your message has been sent to our campus coordinators at <span className="font-bold text-slate-900">evently.nexora@gmail.com</span>. We will respond within 24 hours.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsSuccess(false)}
                      className="mt-6 rounded-full bg-[#0B0F19] hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form-fields"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Error Message */}
                    {errorMessage && (
                      <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 flex items-center gap-2 text-rose-700 text-xs font-semibold">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    {/* Contact Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Row 1: Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact-name" className="block text-xs font-bold text-slate-800 mb-1.5">
                            Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="contact-name"
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            required
                            className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label htmlFor="contact-email" className="block text-xs font-bold text-slate-800 mb-1.5">
                            Email <span className="text-rose-500">*</span>
                          </label>
                          <input
                            id="contact-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Row 2: Mobile Number & User Type Dropdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="contact-phone" className="block text-xs font-bold text-slate-800 mb-1.5">
                            Mobile Number
                          </label>
                          <input
                            id="contact-phone"
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+977 98XXXXXXXX"
                            className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                          />
                        </div>

                        {/* Dropdown for "I am a" */}
                        <div className="relative" ref={dropdownRef}>
                          <label className="block text-xs font-bold text-slate-800 mb-1.5">
                            I am a
                          </label>
                          <button
                            type="button"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-left flex items-center justify-between focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none cursor-pointer"
                          >
                            <span className={formData.userType ? 'text-slate-900 font-medium' : 'text-slate-400'}>
                              {formData.userType || 'Select user type'}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`text-slate-400 transition-transform duration-200 ${
                                dropdownOpen ? 'rotate-180 text-purple-600' : ''
                              }`}
                            />
                          </button>

                          <AnimatePresence>
                            {dropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                transition={{ duration: 0.15 }}
                                className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl bg-white border border-slate-200/90 shadow-2xl p-1 space-y-0.5 overflow-hidden"
                              >
                                {USER_TYPES.map((type) => {
                                  const isSelected = formData.userType === type;
                                  return (
                                    <button
                                      key={type}
                                      type="button"
                                      onClick={() => handleSelectUserType(type)}
                                      className={`w-full text-left px-3.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center justify-between ${
                                        isSelected
                                          ? 'bg-purple-50 text-purple-700 font-bold'
                                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                                      }`}
                                    >
                                      <span>{type}</span>
                                      {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />}
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Row 3: Subject */}
                      <div>
                        <label htmlFor="contact-subject" className="block text-xs font-bold text-slate-800 mb-1.5">
                          Subject <span className="text-rose-500">*</span>
                        </label>
                        <input
                          id="contact-subject"
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder="What's this about?"
                          required
                          className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none"
                        />
                      </div>

                      {/* Row 4: Message */}
                      <div>
                        <label htmlFor="contact-message" className="block text-xs font-bold text-slate-800 mb-1.5">
                          Message <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          id="contact-message"
                          name="message"
                          rows={4}
                          value={formData.message}
                          onChange={handleChange}
                          placeholder="Tell us more..."
                          required
                          className="w-full rounded-xl border border-slate-200/90 bg-[#f9fafb] px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all outline-none resize-none"
                        />
                      </div>

                      {/* Bottom Row: Quick Tags + Submit Button */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Quick Topic Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                          {QUICK_TOPICS.map((topic) => {
                            const isSelected = activeTag === topic.label;
                            return (
                              <button
                                key={topic.label}
                                type="button"
                                onClick={() => handleQuickTopic(topic)}
                                className={`rounded-full px-3 py-1 text-[11px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#0B0F19] text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                }`}
                              >
                                {topic.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full sm:w-auto rounded-full bg-[#0B0F19] hover:bg-slate-800 text-white font-bold text-xs px-7 py-2.5 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-60 cursor-pointer"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={14} className="animate-spin text-purple-400" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Send size={13} className="-rotate-12" />
                              <span>Send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Column: Contact Cards Stack - Perfectly Proportioned */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col justify-between gap-3 sm:gap-3.5">
            
            {/* 1. EMAIL US Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100/60 shadow-2xs">
                <Mail size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                  EMAIL US
                </span>
                <a
                  href="mailto:evently.nexora@gmail.com"
                  className="mt-0.5 block text-xs sm:text-sm font-black text-slate-900 hover:text-purple-700 transition truncate"
                  title="evently.nexora@gmail.com"
                >
                  evently.nexora@gmail.com
                </a>
                <p className="text-[11px] text-slate-500 font-medium">
                  We reply within 24 hours
                </p>
              </div>
            </div>

            {/* 2. CALL US Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100/60 shadow-2xs">
                <Phone size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                  CALL US
                </span>
                <a
                  href="tel:021500050"
                  className="mt-0.5 block text-xs sm:text-sm font-black text-slate-900 hover:text-blue-700 transition"
                >
                  021-500050
                </a>
                <p className="text-[11px] text-slate-500 font-medium">
                  Sun–Fri, 9:00 AM – 6:00 PM NPT
                </p>
              </div>
            </div>

            {/* 3. VISIT US Card (Clickable Google Maps Location) */}
            <a
              href="https://maps.app.goo.gl/sHAF4fZnPGWHwu3L7"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border border-slate-200/80 shadow-xs flex items-center gap-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100/60 shadow-2xs group-hover:scale-105 group-hover:bg-emerald-100 transition-all">
                <MapPin size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="block text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                    VISIT US
                  </span>
                  <ExternalLink size={12} className="text-slate-400 group-hover:text-emerald-600 transition" />
                </div>
                <p className="mt-0.5 text-xs sm:text-sm font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition truncate">
                  Brikuti Marg, Biratnagar 56613
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Biratnagar International College HQ
                </p>
              </div>
            </a>

            {/* 4. FOLLOW US Card (Matches Reference Image Order) */}
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-4.5 border border-slate-200/80 shadow-xs space-y-2.5">
              <span className="block text-[9.5px] font-black uppercase tracking-widest text-slate-400">
                FOLLOW US
              </span>
              
              {/* Verified Social Round Buttons */}
              <div className="flex items-center gap-2.5">
                <a
                  href="https://www.instagram.com/bic.brt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-purple-100 hover:text-purple-700 text-slate-700 transition hover:scale-110 shadow-2xs"
                >
                  <InstagramIcon size={15} />
                </a>
                <a
                  href="https://www.linkedin.com/school/biratnagar-international-college"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 transition hover:scale-110 shadow-2xs"
                >
                  <LinkedinIcon size={15} />
                </a>
                <a
                  href="https://www.facebook.com/bicbrt/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 hover:text-blue-600 text-slate-700 transition hover:scale-110 shadow-2xs"
                >
                  <FacebookIcon size={15} />
                </a>
              </div>

              {/* SheKunj Signature Instagram Follow Pill */}
              <a
                href="https://www.instagram.com/bic.brt/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 py-2 px-4 text-xs font-bold text-white shadow-xs hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
              >
                <InstagramIcon size={14} />
                <span>Follow @bic.brt</span>
              </a>
            </div>

            {/* 5. Office Hours Distinctive Card (Light Lime Green at Bottom matching Reference) */}
            <div className="rounded-2xl sm:rounded-3xl bg-[#f4fbe8] border border-[#d9f2ba] p-4 sm:p-4.5 shadow-2xs">
              <h4 className="text-xs font-black text-slate-900 leading-tight">
                Office hours
              </h4>
              <div className="mt-1 space-y-0.5 text-xs">
                <p className="text-[11px] text-slate-600 font-medium">Sunday – Friday</p>
                <p className="text-xs font-black text-slate-900">
                  9:00 AM – 6:00 PM NPT
                </p>
                <p className="text-[10px] font-bold text-amber-800/80 pt-0.5">
                  (Saturday: Closed)
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
