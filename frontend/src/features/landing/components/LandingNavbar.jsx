import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLenis } from 'lenis/react';
import { useAuth } from '../../../shared/context/AuthContext';
import { CalendarHeart, ArrowRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LandingNavbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lenis = useLenis();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function getDashboardRoute() {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'faculty') return '/faculty/dashboard';
    return '/student/dashboard';
  }

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (targetId === 'about') {
      if (location.pathname !== '/') {
        navigate('/#about');
      } else {
        window.history.pushState(null, '', '/');
        if (lenis) {
          lenis.scrollTo(0, { duration: 1 });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        // Dispatch micro-interaction event to animate hero
        window.dispatchEvent(new CustomEvent('evently-about-action'));
      }
      return;
    }

    if (location.pathname !== '/') {
      navigate(`/#${targetId}`);
      return;
    }

    const element = document.getElementById(targetId);
    if (element) {
      if (lenis) {
        lenis.scrollTo(element, { offset: -80, duration: 1.2 });
      } else {
        const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: topOffset, behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full rounded-t-[20px] sm:rounded-t-[32px] md:rounded-t-[44px] transition-colors duration-200 py-5 sm:py-6 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-xs border-b border-slate-200/50'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-[1480px] px-6 sm:px-10 md:px-12 flex items-center justify-between">
        {/* 1. Left: Sleek Brand Logo */}
        <Link
          to="/"
          onClick={(e) => handleNavClick(e, 'about')}
          className="flex items-center gap-2.5 group select-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#035352] to-[#012424] text-white shadow-xs group-hover:scale-105 transition-transform">
            <CalendarHeart size={20} />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900 font-sans">
            Evently
          </span>
        </Link>

        {/* 2. Center: Clean SheKunj Grey Pill Menu (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5 rounded-full bg-[#edf0f5] px-5 py-2 text-[13.5px] sm:text-sm font-semibold text-slate-700 border border-slate-200/60 shadow-2xs">
          <a
            href="#about"
            onClick={(e) => handleNavClick(e, 'about')}
            className="rounded-full px-4 py-2 text-slate-700 hover:text-slate-950 hover:bg-white hover:shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            About Us
          </a>
          <a
            href="#discover"
            onClick={(e) => handleNavClick(e, 'discover')}
            className="rounded-full px-4 py-2 text-slate-700 hover:text-slate-950 hover:bg-white hover:shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Discover
          </a>
          <a
            href="#devcorps"
            onClick={(e) => handleNavClick(e, 'devcorps')}
            className="rounded-full px-4 py-2 text-slate-700 hover:text-slate-950 hover:bg-white hover:shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            DevCorps
          </a>
          <a
            href="#contact"
            onClick={(e) => handleNavClick(e, 'contact')}
            className="rounded-full px-4 py-2 text-slate-700 hover:text-slate-950 hover:bg-white hover:shadow-2xs active:scale-95 transition-all duration-150 cursor-pointer"
          >
            Contact Us
          </a>
        </nav>

        {/* 3. Right: Get Started Button & Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <Link
            to={user ? getDashboardRoute() : '/login'}
            className="rounded-full bg-[#0B0F19] hover:bg-slate-800 px-6 sm:px-7 py-2.5 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all hover:shadow hover:scale-105 active:scale-95 cursor-pointer"
          >
            {user ? (
              <>
                <span>Dashboard</span>
                <ArrowRight size={13} />
              </>
            ) : (
              <span>Get Started</span>
            )}
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden mx-4 mt-3 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-4 space-y-1"
          >
            <a
              href="#about"
              onClick={(e) => handleNavClick(e, 'about')}
              className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              About Us
            </a>
            <a
              href="#discover"
              onClick={(e) => handleNavClick(e, 'discover')}
              className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              Discover
            </a>
            <a
              href="#devcorps"
              onClick={(e) => handleNavClick(e, 'devcorps')}
              className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              DevCorps
            </a>
            <a
              href="#contact"
              onClick={(e) => handleNavClick(e, 'contact')}
              className="block rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
            >
              Contact Us
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
