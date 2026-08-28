import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from '../components/LandingNavbar';
import LandingHero from '../components/LandingHero';
import LandingEventsGrid from '../components/LandingEventsGrid';
import LandingDevCorps from '../components/LandingDevCorps';
import LandingContact from '../components/LandingContact';
import LandingFooter from '../components/LandingFooter';

export default function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Evently • Biratnagar International College Campus Platform';

    if (location.hash) {
      const targetId = location.hash.replace('#', '');
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          const topOffset = element.getBoundingClientRect().top + window.scrollY - 80;
          window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-[#edf0f5] p-2.5 sm:p-4 md:p-6 selection:bg-primary-600 selection:text-white flex flex-col justify-between">
      {/* SheKunj Signature Curved App Container */}
      <div className="w-full max-w-[1580px] mx-auto bg-white rounded-[32px] sm:rounded-[44px] shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col flex-1">
        {/* Top Hero & Navbar Area */}
        <div className="shekunj-hero-gradient relative">
          <LandingNavbar />
          <LandingHero />
        </div>

        <main className="flex-1">
          <LandingEventsGrid />
          <LandingDevCorps />
          <LandingContact />
        </main>
        <LandingFooter />
      </div>
    </div>
  );
}
