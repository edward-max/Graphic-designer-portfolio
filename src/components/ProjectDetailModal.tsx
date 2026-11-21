import React, { useState, useEffect } from 'react';
import { X, Calendar, User, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';

interface ProjectDetailModalProps {
  project: Project | null;
  allProjects: Project[];
  onSelectProject: (project: Project) => void;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  allProjects,
  onSelectProject,
  onClose,
}) => {
  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (project) {
      setActiveImage(project.image_url);
    }
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [project, onClose]);

  if (!project) return null;

  const images = [project.image_url, ...(project.gallery_images || [])].filter(Boolean);
  const related = allProjects
    .filter((p) => p.id !== project.id && (p.category === project.category || p.featured))
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-950/92 backdrop-blur-2xl flex items-center justify-center p-4 md:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div className="max-w-5xl w-full glass-panel rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl my-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Close project detail"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Image & Gallery Thumbnails */}
          <div className="lg:col-span-7 bg-neutral-900 p-6 flex flex-col gap-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-neutral-950">
              <img
                src={activeImage || project.image_url}
                alt={project.title}
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(img)}
                    className={`aspect-video rounded-xl overflow-hidden border transition-all cursor-pointer ${
                      activeImage === img
                        ? 'border-violet-500 ring-2 ring-violet-500/40'
                        : 'border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${project.title} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Project Details */}
          <div className="lg:col-span-5 p-8 flex flex-col justify-between bg-neutral-950">
            <div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4 tabular-nums">
                <span className="text-violet-400 font-semibold uppercase tracking-wider">
                  {project.category}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {project.year}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Space_Grotesk'] mb-4 pr-10">
                {project.title}
              </h2>

              <p className="text-neutral-300 text-sm sm:text-base leading-relaxed mb-6">
                {project.description}
              </p>

              {project.client && (
                <div className="flex items-center gap-2 text-xs text-neutral-400 pb-6 border-b border-neutral-900">
                  <User className="w-4 h-4 text-violet-400" />
                  <span>
                    Client: <strong className="text-white">{project.client}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className="pt-6">
              <a
                href="#contact"
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors text-center flex items-center justify-center gap-2 min-h-[44px]"
              >
                <span>Start a Similar Project</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Related Projects Strip */}
        {related.length > 0 && (
          <div className="border-t border-neutral-800 bg-neutral-950/90 px-6 md:px-8 py-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-4">
              Related Projects
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((rel) => (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectProject(rel)}
                  className="text-left p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 hover:border-violet-500/40 transition-colors flex items-center gap-3 cursor-pointer"
                >
                  <img
                    src={rel.image_url}
                    alt={rel.title}
                    className="w-14 h-14 rounded-lg object-cover shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] text-violet-400 font-medium">{rel.category}</div>
                    <div className="text-xs font-bold text-white truncate">{rel.title}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
