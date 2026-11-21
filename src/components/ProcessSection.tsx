import React from 'react';
import { Search, Lightbulb, Palette, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export const ProcessSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Discover',
      description: 'Understand the client, brand positioning, target audience, and core objective.',
      icon: Search,
    },
    {
      number: '02',
      title: 'Concept',
      description: 'Develop visual directions, mood boards, and distinct creative ideas.',
      icon: Lightbulb,
    },
    {
      number: '03',
      title: 'Design',
      description: 'Turn the selected concept into polished, high-impact visual assets.',
      icon: Palette,
    },
    {
      number: '04',
      title: 'Refine',
      description: 'Make thoughtful revisions and elevate typography, spacing, and balance.',
      icon: RefreshCw,
    },
    {
      number: '05',
      title: 'Deliver',
      description: 'Provide professional final files organized and ready for print or digital launch.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="process" className="py-24 bg-neutral-900/40 border-t border-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
            Methodology
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            My Design Process
          </h2>
          <p className="text-neutral-400 mt-4 text-base">
            A clear, collaborative five-step workflow that takes every brief from initial discovery to final production files.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-violet-500/40 transition-colors group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-black text-violet-400 font-['Space_Grotesk'] tabular-nums">
                      {step.number}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <IconComponent className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] mb-2 group-hover:text-violet-300 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
