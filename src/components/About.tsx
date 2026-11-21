import React from 'react';
import { CheckCircle2, Layers } from 'lucide-react';
import { SiteSettings } from '../types';

interface AboutProps {
  settings: SiteSettings;
}

export const About: React.FC<AboutProps> = ({ settings }) => {
  const tools = settings.tools || [];

  return (
    <section id="about" className="py-24 bg-neutral-900/40 border-b border-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
            About Koby
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            {settings.aboutHeading}
          </h2>
          <p className="text-neutral-300 mt-4 text-base leading-relaxed">
            {settings.aboutIntro}
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Introduction, Approach & Philosophy */}
          <div className="lg:col-span-7 glass-panel p-8 md:p-10 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-4">
                {settings.aboutBioTitle}
              </h3>

              <p className="text-neutral-300 leading-relaxed mb-4 text-sm sm:text-base">
                {settings.aboutBioParagraph1}
              </p>

              <p className="text-neutral-400 leading-relaxed text-sm sm:text-base">
                {settings.aboutBioParagraph2}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-8 border-t border-neutral-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">{settings.aboutApproachTitle}</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {settings.aboutApproachDesc}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-white">{settings.aboutDeliveryTitle}</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    {settings.aboutDeliveryDesc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Software & Tools Stack */}
          <div className="lg:col-span-5 glass-panel p-8 rounded-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Layers className="w-5 h-5 text-violet-400" />
                <span>Tools &amp; Software</span>
              </h3>
              <span className="text-xs text-neutral-400">Daily Stack</span>
            </div>

            <div className="flex flex-col divide-y divide-neutral-800/80">
              {tools.map((tool, index) => (
                <div
                  key={`${tool.name}-${index}`}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                    <p className="text-xs text-neutral-400 mt-0.5">{tool.category}</p>
                  </div>
                  <span className="text-xs font-medium text-violet-300 whitespace-nowrap">
                    {tool.level}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-neutral-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-neutral-400">Projects Delivered:</span>{' '}
                <strong className="text-white tabular-nums">{settings.creativeProjects}</strong>
              </div>
              <div>
                <span className="text-neutral-400">Happy Clients:</span>{' '}
                <strong className="text-white tabular-nums">{settings.happyClients}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
