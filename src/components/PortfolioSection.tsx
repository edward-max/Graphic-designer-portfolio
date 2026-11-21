import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Folder, ImageOff } from 'lucide-react';
import { Project, ProjectCategory } from '../types';

interface PortfolioSectionProps {
  projects: Project[];
  activeCategory: ProjectCategory | 'All';
  onSelectCategory: (cat: ProjectCategory | 'All') => void;
  onSelectProject: (project: Project) => void;
  loading?: boolean;
}

const PAGE_SIZE = 9;

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  projects,
  activeCategory,
  onSelectCategory,
  onSelectProject,
  loading = false,
}) => {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [activeCategory]);

  const categories: Array<ProjectCategory | 'All'> = [
    'All',
    'Flyers',
    'Branding',
    'Social Media',
    'Posters',
    'Print Design',
    'Other',
  ];

  const filteredProjects =
    activeCategory === 'All'
      ? projects
      : projects.filter((p) => p.category === activeCategory);

  const visibleProjects = filteredProjects.slice(0, visibleCount);
  const hasMore = filteredProjects.length > visibleCount;

  return (
    <section id="portfolio" className="py-24 bg-neutral-950 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
              Featured Portfolio
            </p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight">
              Selected Design Works
            </h2>
            <p className="text-neutral-400 mt-4 text-base">
              Brand identities, flyers, posters, and digital campaigns crafted for impact.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="Portfolio categories"
            className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-neutral-900 border border-neutral-800"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => onSelectCategory(cat)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[36px] ${
                  activeCategory === cat
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading && projects.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-neutral-900/60 border border-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 glass-panel rounded-2xl">
            <Folder className="w-10 h-10 text-neutral-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white font-['Space_Grotesk']">
              No projects in {activeCategory} yet
            </h3>
            <p className="text-sm text-neutral-400 mt-1">
              Select another category or publish a new project in the Admin CMS.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleProjects.map((project) => (
                <article
                  key={project.id}
                  data-cursor="view"
                  onClick={() => onSelectProject(project)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectProject(project);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`View details for ${project.title}`}
                  className="glass-card rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-violet-500/40 transition-all duration-200 flex flex-col hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  {/* Image Container */}
                  <div className="aspect-[4/3] overflow-hidden relative bg-neutral-900">
                    {failedImages[project.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800 text-neutral-400 p-6 text-center">
                        <ImageOff className="w-8 h-8 mb-2 text-neutral-500" />
                        <span className="text-xs font-medium">{project.title}</span>
                      </div>
                    ) : (
                      <img
                        src={project.image_url}
                        alt={project.title}
                        loading="lazy"
                        onError={() =>
                          setFailedImages((prev) => ({ ...prev, [project.id]: true }))
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity" />
                  </div>

                  {/* Card Details - Zero-Pill Metadata */}
                  <div className="p-6 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2 tabular-nums">
                        <span className="text-violet-400 font-semibold">{project.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{project.year}</span>
                        {project.featured && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-neutral-300">Featured</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-white font-['Space_Grotesk'] group-hover:text-violet-300 transition-colors mb-2">
                        {project.title}
                      </h3>

                      <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-5 border-t border-neutral-900 flex items-center justify-between">
                      <span className="text-xs text-neutral-400">
                        {project.client ? project.client : 'Studio Commission'}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-7 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-sm font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer min-h-[44px]"
                >
                  Load More Projects ({filteredProjects.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};
