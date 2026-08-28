import { useEffect } from 'react';
import LandingNavbar from '../../landing/components/LandingNavbar';
import LandingContact from '../../landing/components/LandingContact';
import LandingFooter from '../../landing/components/LandingFooter';

export default function ContactPage() {
  useEffect(() => {
    document.title = 'Contact Us • Biratnagar International College';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-[#edf0f5] p-2.5 sm:p-4 md:p-6 selection:bg-primary-600 selection:text-white flex flex-col justify-between">
      <div className="w-full max-w-[1580px] mx-auto bg-white rounded-[32px] sm:rounded-[44px] shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col flex-1">
        <div className="shekunj-hero-gradient relative">
          <LandingNavbar />
        </div>

        <main className="flex-1">
          <LandingContact />
        </main>
        
        <LandingFooter />
      </div>
    </div>
  );
}
