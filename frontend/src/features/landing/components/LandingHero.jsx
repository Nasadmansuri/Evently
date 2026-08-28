import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Trophy, Briefcase, Calendar, Users, ChevronDown, Sparkles } from 'lucide-react';
import bicBuildingImg from '../../../assets/bic-building.png';

const HERO_PHRASES = [
  'Discover Campus Life',
  'College Hackathons',
  'Technical Workshops',
  'DevCorps Communities',
  'Campus Opportunities',
  'Cultural Celebrations'
];

export default function LandingHero() {
  const { scrollY } = useScroll();
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [actionPulse, setActionPulse] = useState(false);

  // Relaxed auto-cycle interval (4.0 seconds) for smooth, readable pacing
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Ultra-smooth scroll-driven building parallax & zoom based on page scroll
  const buildingScale = useTransform(scrollY, [0, 500], [1, 1.14]);
  const buildingY = useTransform(scrollY, [0, 500], [0, -40]);

  useEffect(() => {
    const handleAboutAction = () => {
      setActionPulse(true);
      setCurrentPhraseIndex((prev) => (prev + 1) % HERO_PHRASES.length);
      const timer = setTimeout(() => setActionPulse(false), 1000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('evently-about-action', handleAboutAction);
    return () => window.removeEventListener('evently-about-action', handleAboutAction);
  }, []);

  return (
    <section id="about" className="relative overflow-hidden pt-6 pb-12 sm:pb-16 shekunj-hero-gradient">
      {/* Background Soft Radiant Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-primary-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/6 w-[350px] h-[350px] bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/6 w-[350px] h-[350px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        {/* 1. Header Typography & SheKunj Animated Wavy Rainbow Accent */}
        <div className="text-center max-w-4xl mx-auto space-y-3 pt-4 sm:pt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: actionPulse ? [1, 1.03, 1] : 1,
            }}
            transition={{ duration: 0.5 }}
          >
            {/* Dynamic Smooth Floating Rotating Headline (No harsh overflow clipping) */}
            <div className="min-h-[64px] sm:min-h-[86px] lg:min-h-[98px] flex items-center justify-center relative">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, y: 22, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -22, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
                  className="text-4xl sm:text-6xl lg:text-[76px] font-black tracking-tight text-slate-900 leading-[1.06] select-none text-center"
                >
                  {HERO_PHRASES[currentPhraseIndex]}
                </motion.h1>
              </AnimatePresence>
            </div>

            {/* SheKunj Continuous Rainbow Wavy Underline with Flowing Motion */}
            <div className="flex justify-center mt-2 sm:mt-3">
              <svg
                width="260"
                height="22"
                viewBox="0 0 260 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-52 sm:w-68 overflow-visible"
              >
                <defs>
                  <linearGradient id="shekunj_rainbow" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00C5A0" />
                    <stop offset="25%" stopColor="#10B981" />
                    <stop offset="55%" stopColor="#F59E0B" />
                    <stop offset="80%" stopColor="#EC4899" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M6 14C45 5 90 5 130 14C170 23 215 14 254 5"
                  stroke="url(#shekunj_rainbow)"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "280", strokeDashoffset: 0 }}
                  animate={{
                    strokeDashoffset: [280, 0, -280],
                  }}
                  transition={{
                    duration: 3.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </svg>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto pt-1"
          >
            Empowering students at Biratnagar International College through curated college hackathons, skill development, and tech communities, all in one trusted campus platform.
          </motion.p>
        </div>

        {/* 2. Symmetrical Floating Badges & BIC Campus Building */}
        <div className="relative mt-8 sm:mt-12 max-w-5xl mx-auto">
          {/* Badge 1: Top-Left - Hackathons */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="absolute top-2 sm:top-6 left-0 sm:left-4 z-20 animate-float-slow"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200/80 bg-white/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shadow-2xs">
                <Trophy size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Hackathons</p>
                <p className="text-[10.5px] font-semibold text-slate-500">Join campus hackathons</p>
              </div>
            </div>
          </motion.div>

          {/* Badge 2: Top-Right - Workshops */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="absolute top-2 sm:top-6 right-0 sm:right-4 z-20 animate-float-reverse"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-blue-200/80 bg-white/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-800 shadow-2xs">
                <Briefcase size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Workshops</p>
                <p className="text-[10.5px] font-semibold text-slate-500">Discover opportunities</p>
              </div>
            </div>
          </motion.div>

          {/* Badge 3: Mid-Left - Campus Events */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="absolute bottom-16 sm:bottom-24 left-0 sm:left-6 z-20 hidden md:block animate-float-reverse"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-white/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 shadow-2xs">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Events</p>
                <p className="text-[10.5px] font-semibold text-slate-500">Discover upcoming events</p>
              </div>
            </div>
          </motion.div>

          {/* Badge 4: Mid-Right - DevCorps Competitions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.45 }}
            className="absolute bottom-16 sm:bottom-24 right-0 sm:right-6 z-20 hidden md:block animate-float-slow"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-purple-200/80 bg-white/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-800 shadow-2xs">
                <Users size={18} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">DevCorps</p>
                <p className="text-[10.5px] font-semibold text-slate-500">Showcase your skills</p>
              </div>
            </div>
          </motion.div>

          {/* Central BIC Campus Building Illustration with Smooth GPU Scroll Parallax */}
          <div className="relative pt-6 sm:pt-10 pb-4 flex justify-center items-center">
            <motion.div
              style={{
                scale: buildingScale,
                y: buildingY,
              }}
              className="w-full max-w-4xl will-change-transform transform-gpu"
            >
              <img
                src={bicBuildingImg}
                alt="Biratnagar International College Campus Building"
                className="w-full h-auto object-contain select-none pointer-events-none"
              />
            </motion.div>
          </div>

          {/* SheKunj Scroll Down Indicator */}
          <div className="flex flex-col items-center justify-center pt-2 text-slate-400 text-[11px] font-bold tracking-widest uppercase">
            <span>SCROLL</span>
            <ChevronDown size={14} className="animate-bounce mt-0.5" />
          </div>
        </div>
      </div>
    </section>
  );
}
