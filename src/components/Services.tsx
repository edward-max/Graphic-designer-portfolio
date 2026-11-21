import React from 'react';
import { Palette, Share2, FileText, Megaphone, Printer, Sparkles, ArrowUpRight } from 'lucide-react';
import { ProjectCategory } from '../types';

interface ServicesProps {
  onSelectCategory: (category: ProjectCategory | 'All') => void;
}

export const Services: React.FC<ServicesProps> = ({ onSelectCategory }) => {
  const servicesList: Array<{
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
    portfolioCategory: ProjectCategory | 'All';
  }> = [
    {
      icon: Palette,
      title: 'Brand Identity',
      description:
        'Logo design, visual identity, brand direction and supporting brand assets built for unmistakable recognition.',
      portfolioCategory: 'Branding',
    },
    {
      icon: Share2,
      title: 'Social Media Design',
      description:
        'Social media flyers, promotional graphics, campaign visuals and digital content crafted to stop the scroll.',
      portfolioCategory: 'Social Media',
    },
    {
      icon: FileText,
      title: 'Flyer & Poster Design',
      description:
        'Professional flyers, event posters, promotional materials and campaign graphics with bold hierarchy.',
      portfolioCategory: 'Flyers',
    },
    {
      icon: Megaphone,
      title: 'Marketing Design',
      description:
        'Advertising creatives, promotional graphics, campaign materials and business visuals engineered to convert.',
      portfolioCategory: 'Social Media',
    },
    {
      icon: Printer,
      title: 'Print Design',
      description:
        'Business cards, brochures, banners, roll-up designs, invitations and tactile print collateral.',
      portfolioCategory: 'Print Design',
    },
    {
      icon: Sparkles,
      title: 'Creative Design',
      description:
        'Custom visual concepts and bespoke artistic direction created around your specific campaign needs.',
      portfolioCategory: 'Other',
    },
  ];

  const handleViewWork = (category: ProjectCategory | 'All') => {
    onSelectCategory(category);
    const el = document.getElementById('portfolio');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="services" className="py-24 bg-neutral-950 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
            Services
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
            Design Services Tailored For Impact
          </h2>
          <p className="text-neutral-400 mt-4 text-base">
            Focused creative capabilities across brand identity, campaign flyers, digital content, and print production.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicesList.map((service, index) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.title}
                className="glass-card p-8 rounded-2xl border border-white/10 hover:border-violet-500/40 transition-all duration-200 group flex flex-col justify-between hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-neutral-500 font-['Space_Grotesk'] tabular-nums">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] mb-3 group-hover:text-violet-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-neutral-900 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => handleViewWork(service.portfolioCategory)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-white transition-colors cursor-pointer min-h-[36px]"
                  >
                    <span>View Work</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs text-neutral-500">{service.portfolioCategory}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
