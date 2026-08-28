import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import devsphereLogo from '../../../assets/communities/devsphere.png';
import aiHorizonLogo from '../../../assets/communities/ai-horizon.png';
import bicConvergeLogo from '../../../assets/communities/bic-converge.png';
import incognitusLogo from '../../../assets/communities/incognitus.png';

const COMMUNITIES = [
  {
    name: 'DevSphere',
    tagline: 'Web Development & Open-Source',
    description: 'Dedicated to web development and open-source engineering. It fosters collaboration through shared workflows and transparent teamwork, bridging academic theory with software delivery.',
    logo: devsphereLogo,
    badge: 'Web & Open-Source',
    leads: 'DevCorps Chapter',
    tint: 'bg-[#f0f7ff] border-blue-200/90 text-blue-700',
    badgeBg: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  {
    name: 'AI Horizon',
    tagline: 'Artificial Intelligence & Intelligent Systems',
    description: 'An AI learning platform focused on hands-on, project-based exploration. It provides real-world AI skills, ethical awareness, and innovative thinking for intelligent systems.',
    logo: aiHorizonLogo,
    badge: 'AI & Data Science',
    leads: 'DevCorps Chapter',
    tint: 'bg-[#fffdf5] border-amber-200/90 text-amber-700',
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    name: 'BIC Converge',
    tagline: 'Business, Applied Learning & Incubation',
    description: 'A business community that delivers applied learning through workshops, incubation programmes, and industry interactions, equipping participants with entrepreneurial readiness.',
    logo: bicConvergeLogo,
    badge: 'Business & Incubation',
    leads: 'DevCorps Chapter',
    tint: 'bg-[#f0fdf9] border-emerald-200/90 text-emerald-700',
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    name: 'inCognitus',
    tagline: '<Identity is a Variable> • Cybersecurity',
    description: 'A cybersecurity community focusing on ethical hacking, real-world cyber threats, and practical skill development to strengthen security expertise and defensive techniques.',
    logo: incognitusLogo,
    badge: 'Security & Ethical Hacking',
    leads: 'DevCorps Chapter',
    tint: 'bg-[#fdf8ff] border-purple-200/90 text-purple-700',
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-100',
  },
];

export default function LandingDevCorps() {
  return (
    <section id="devcorps" className="py-16 sm:py-24 bg-white relative overflow-hidden border-t border-slate-100">
      <div className="mx-auto max-w-[1480px] px-6 sm:px-10 md:px-12">
        {/* 1. Top Badge */}
        <div className="mb-3">
          <span className="rounded-full bg-purple-50 px-3.5 py-1 text-[10.5px] font-extrabold uppercase tracking-widest text-purple-600 border border-purple-100 shadow-2xs">
            STUDENT COMMUNITIES
          </span>
        </div>

        {/* 2. Main Headline Row with "Explore Chapters →" CTA */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              BIC DevCorps <span className="text-[#7c3aed]">Student Hub.</span>
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-500 font-medium max-w-xl">
              Collaborate, build projects, and organize flagship events with fellow students in your favorite domain across 4 student-led chapters.
            </p>
          </div>

          <Link
            to="/events"
            className="self-start md:self-end rounded-full bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-bold text-slate-800 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition hover:shadow hover:border-slate-300 shrink-0"
          >
            <span>Explore Events</span>
            <ArrowRight size={13} className="text-slate-500" />
          </Link>
        </div>

        {/* 3. 4 Chapters Grid (SheKunj Unified Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {COMMUNITIES.map((club, index) => {
            return (
              <motion.div
                key={club.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
                className="rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 flex flex-col justify-between bg-white border border-slate-200/80 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
              >
                <div>
                  {/* Official Community Graphic Artwork Container */}
                  <div className="h-36 w-full overflow-hidden rounded-2xl bg-[#fafafa] border border-slate-100 mb-4 flex items-center justify-center p-4 shadow-inner group-hover:scale-[1.02] transition-transform duration-300">
                    <img
                      src={club.logo}
                      alt={`${club.name} Logo`}
                      className="h-full w-full object-contain filter drop-shadow-xs select-none"
                    />
                  </div>

                  {/* Badge */}
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${club.badgeBg}`}>
                    {club.badge}
                  </span>

                  {/* Title & Tagline */}
                  <h3 className="mt-2.5 text-lg font-black tracking-tight text-slate-900 group-hover:text-purple-700 transition">
                    {club.name}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {club.tagline}
                  </p>

                  {/* Description */}
                  <p className="mt-2.5 text-xs text-slate-600 leading-relaxed line-clamp-3 font-normal">
                    {club.description}
                  </p>
                </div>

                {/* Bottom Row */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {club.leads}
                  </span>
                  <Link
                    to={`/events?department=community:${encodeURIComponent(club.name)}`}
                    className="rounded-full bg-[#0B0F19] hover:bg-slate-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs flex items-center gap-1 transition-all hover:scale-105 active:scale-95 shrink-0"
                  >
                    <span>Events</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
