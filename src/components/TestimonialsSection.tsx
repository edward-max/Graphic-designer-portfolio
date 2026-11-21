import React, { useState } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { TestimonialItem } from '../types';

interface TestimonialsSectionProps {
  testimonials: TestimonialItem[];
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ testimonials }) => {
  const [page, setPage] = useState(0);
  const perPage = 3;
  const totalPages = Math.max(1, Math.ceil(testimonials.length / perPage));
  const safePage = Math.min(page, totalPages - 1);
  const visible = testimonials.slice(safePage * perPage, safePage * perPage + perPage);

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('');

  return (
    <section className="py-24 bg-neutral-950 relative border-t border-neutral-900">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
              Client Feedback
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Trusted By Creators &amp; Brands
            </h2>
            <p className="text-neutral-400 mt-4 text-base">
              Direct perspectives from founders, event directors, and brand leads we have partnered with.
            </p>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPage((p) => (p > 0 ? p - 1 : totalPages - 1))}
                aria-label="Previous testimonials"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-neutral-400 tabular-nums px-2">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => (p + 1) % totalPages)}
                aria-label="Next testimonials"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 flex items-center justify-center cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Testimonials Grid */}
        {testimonials.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center text-sm text-neutral-400">
            No client testimonials published yet. Add testimonials in the Admin CMS.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visible.map((item) => (
              <blockquote
                key={item.id}
                className="glass-card p-8 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-violet-500/30 transition-colors"
              >
                <div>
                  <Quote className="w-7 h-7 text-violet-400/50 mb-5" aria-hidden="true" />
                  <p className="text-neutral-200 text-sm sm:text-base leading-relaxed mb-8">
                    “{item.text}”
                  </p>
                </div>

                <footer className="flex items-center gap-3.5 pt-6 border-t border-neutral-900">
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-11 h-11 rounded-full object-cover border border-violet-500/30 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="w-11 h-11 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-200 font-['Space_Grotesk'] shrink-0"
                    >
                      {getInitials(item.name)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-white font-['Space_Grotesk']">
                      {item.name}
                    </div>
                    <div className="text-xs text-neutral-400">
                      {item.role} · <span className="text-violet-400">{item.company}</span>
                    </div>
                  </div>
                </footer>
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
