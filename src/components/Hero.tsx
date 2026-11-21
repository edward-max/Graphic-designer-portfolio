import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { SiteSettings } from '../types';

interface HeroProps {
  settings: SiteSettings;
}

export const Hero: React.FC<HeroProps> = ({ settings }) => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col justify-center pt-28 pb-16 overflow-hidden border-b border-neutral-900"
    >
      {/* Subtle architectural grid lines & ambient gradients */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] bg-violet-600/12 rounded-full blur-[130px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 w-full relative z-10">
        {/* Balanced 2-Column Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          {/* Left Column: Typographic Hierarchy & CTAs */}
          <div className="lg:col-span-7 flex flex-col justify-center items-start text-left">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="text-xs font-medium tracking-wide text-neutral-300 mb-6 flex items-center gap-2.5"
            >
              <span className="text-emerald-400" aria-hidden="true">●</span>
              <span>{settings.heroAvailability}</span>
              <span className="text-neutral-600" aria-hidden="true">·</span>
              <span className="text-neutral-400">Visual Identity &amp; Digital Design</span>
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-6 font-['Space_Grotesk'] max-w-2xl"
              style={{ textWrap: 'balance' }}
            >
              {settings.heroHeadline}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-white">
                {settings.heroHeadlineAccent}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="text-base sm:text-lg text-neutral-300 max-w-xl mb-10 leading-relaxed"
            >
              {settings.heroSubtext}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
            >
              <a
                href="#portfolio"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2.5 group min-h-[44px]"
              >
                <span>View My Work</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#contact"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-semibold text-sm hover:bg-neutral-800 hover:border-neutral-700 transition-colors flex items-center justify-center min-h-[44px]"
              >
                Let’s Work Together
              </a>
            </motion.div>
          </div>

          {/* Right Column: Editorial Studio Visual Container */}
          <div className="lg:col-span-5 flex items-stretch">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.65 }}
              className="relative w-full glass-panel rounded-2xl p-4 flex flex-col justify-between overflow-hidden"
            >
              <div className="relative flex-1 min-h-[300px] lg:min-h-[380px] rounded-xl overflow-hidden bg-neutral-900">
                <img
                  src={settings.profileImageUrl || '/src/assets/images/hero_editorial_showcase_1794870584088.jpg'}
                  alt="Koby — Graphic Designer Profile"
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              <div className="pt-4 px-1 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-bold text-white font-['Space_Grotesk']">
                    {settings.heroShowcaseTitle}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {settings.heroShowcaseSubtitle}
                  </p>
                </div>
                <span className="text-xs font-medium text-neutral-400 tabular-nums whitespace-nowrap">
                  2026 Portfolio
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Full-Width 4-Column KPI Strip Below Hero Split */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-14 pt-8 border-t border-neutral-900">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tabular-nums">
              {settings.creativeProjects}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Creative Projects</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tabular-nums">
              {settings.designServices}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Design Services</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tabular-nums">
              {settings.yearsExperience}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Years Learning &amp; Creating</div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] tabular-nums">
              {settings.happyClients}
            </div>
            <div className="text-xs text-neutral-400 mt-1">Happy Clients</div>
          </div>
        </div>
      </div>
    </section>
  );
};
