import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarHeart, Send, ExternalLink, MapPin, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import bicLogo from '../../../assets/bic-logo.png';
import wlvLogo from '../../../assets/wolverhampton-logo.png';

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

// Dedicated Formspree endpoint for Newsletter Subscribers
const FORMSPREE_NEWSLETTER_ENDPOINT = 'https://formspree.io/f/myeyyopo';

export default function LandingFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(FORMSPREE_NEWSLETTER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'Landing Footer Newsletter',
          subject: 'New Campus Event Alerts Subscription',
          subscribedAt: new Date().toISOString()
        })
      });

      if (res.ok) {
        setIsSubscribed(true);
        setEmail('');
        toast.success('Subscribed! You will receive campus event alerts.');
      } else {
        toast.error('Subscription failed. Please try again later.');
      }
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#02181d] text-slate-300 pt-16 pb-12 border-t border-slate-800/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* 1. Top Row: Brand Info & Newsletter Subscribe */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-slate-800/60">
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white shadow-xs">
                <CalendarHeart size={20} />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-white">Evently</span>
                <span className="ml-2 rounded-full bg-primary-900/80 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-300 border border-primary-700/60">
                  BIC Campus
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium leading-relaxed">
              Eastern Nepal's premier campus event management and student engagement platform, built for Biratnagar International College in partnership with University of Wolverhampton UK.
            </p>
            {/* Institutional Logos */}
            <div className="flex items-center gap-3 pt-1">
              <div className="bg-white rounded-lg px-2 py-1 shadow-2xs border border-white/10 flex items-center justify-center">
                <img src={bicLogo} alt="Biratnagar International College" className="h-6 w-auto object-contain" />
              </div>
              <div className="bg-white rounded-lg px-2 py-1 shadow-2xs border border-white/10 flex items-center justify-center">
                <img src={wlvLogo} alt="University of Wolverhampton" className="h-6 w-auto object-contain" />
              </div>
            </div>
          </div>

          {/* Newsletter / Event Alerts Input */}
          <div className="space-y-2 max-w-md w-full">
            <span className="text-xs font-bold text-slate-200">
              Subscribe to campus event alerts
            </span>

            <AnimatePresence mode="wait">
              {isSubscribed ? (
                <motion.div
                  key="subscribed-state"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex items-center justify-between gap-2.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 px-4 py-2.5 text-xs text-emerald-300 font-semibold shadow-inner"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    <span className="truncate">You're subscribed to BIC event alerts!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSubscribed(false)}
                    title="Add another email"
                    className="text-[10.5px] text-emerald-400/80 hover:text-emerald-200 underline font-normal shrink-0 cursor-pointer"
                  >
                    Add another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="subscribe-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubscribe}
                  className="flex items-center gap-2"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your college email"
                    required
                    className="w-full rounded-full border border-slate-700 bg-slate-900/90 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-60 transition-all hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
                    title="Subscribe"
                  >
                    {isSubmitting ? (
                      <Loader2 size={15} className="animate-spin text-white" />
                    ) : (
                      <Send size={15} />
                    )}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 2. Navigation Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-slate-800/60 text-xs">
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Discover
            </h4>
            <ul className="space-y-2 font-medium text-slate-400">
              <li><Link to="/events" className="hover:text-white transition">All Campus Events</Link></li>
              <li><Link to="/events?category=Hackathons" className="hover:text-white transition">College Hackathons</Link></li>
              <li><Link to="/events?category=Workshops" className="hover:text-white transition">Technical Workshops</Link></li>
              <li><Link to="/events?category=Cultural" className="hover:text-white transition">Cultural Fests</Link></li>
              <li><Link to="/gallery" className="hover:text-white transition">Campus Gallery</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              DevCorps Hub
            </h4>
            <ul className="space-y-2 font-medium text-slate-400">
              <li><a href="#devcorps" className="hover:text-white transition">DevSphere</a></li>
              <li><a href="#devcorps" className="hover:text-white transition">AI Horizon</a></li>
              <li><a href="#devcorps" className="hover:text-white transition">BIC Converge</a></li>
              <li><a href="#devcorps" className="hover:text-white transition">inCognitus</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Campus Portals
            </h4>
            <ul className="space-y-2 font-medium text-slate-400">
              <li><Link to="/login" className="hover:text-white transition">Student Portal</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Faculty Organizer Desk</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Administrative Control</Link></li>
              <li><Link to="/signup/student" className="hover:text-white transition">Student Registration</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              About BIC
            </h4>
            <ul className="space-y-2 font-medium text-slate-400">
              <li>
                <a href="https://bicnepal.edu.np" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-1">
                  <span>BIC Official Website</span>
                  <ExternalLink size={11} />
                </a>
              </li>
              <li><Link to="/terms" className="hover:text-white transition">Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li className="pt-2 text-[11px] text-slate-400 flex items-start gap-1.5">
                <MapPin size={13} className="text-primary-400 shrink-0 mt-0.5" />
                <a
                  href="https://maps.app.goo.gl/sHAF4fZnPGWHwu3L7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition underline-offset-2 hover:underline"
                >
                  Brikuti Marg, Biratnagar, Nepal
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Row: Copyright & Social Links */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Biratnagar International College. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/bic.brt/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Instagram">
              <InstagramIcon size={15} />
            </a>
            <a href="https://www.facebook.com/bicbrt/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="Facebook">
              <FacebookIcon size={15} />
            </a>
            <a href="https://www.linkedin.com/school/biratnagar-international-college" target="_blank" rel="noopener noreferrer" className="hover:text-white transition" aria-label="LinkedIn">
              <LinkedinIcon size={15} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
