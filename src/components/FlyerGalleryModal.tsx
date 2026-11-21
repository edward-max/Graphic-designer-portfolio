import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project } from '../types';

interface FlyerGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  flyerProjects: Project[];
}

export const FlyerGalleryModal: React.FC<FlyerGalleryModalProps> = ({
  isOpen,
  onClose,
  flyerProjects,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setZoomed(false);
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
      setZoomed(false);
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedIndex !== null) {
          setSelectedIndex(null);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft' && flyerProjects.length > 0) {
        if (selectedIndex !== null) {
          setSelectedIndex((prev) =>
            prev !== null && prev > 0 ? prev - 1 : flyerProjects.length - 1
          );
        }
      } else if (e.key === 'ArrowRight' && flyerProjects.length > 0) {
        if (selectedIndex !== null) {
          setSelectedIndex((prev) =>
            prev !== null && prev < flyerProjects.length - 1 ? prev + 1 : 0
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flyerProjects.length, onClose]);

  if (!isOpen) return null;

  const selectedProject = selectedIndex !== null ? flyerProjects[selectedIndex] : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 bg-neutral-950/97 backdrop-blur-2xl flex flex-col overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Flyer Designs Full-Screen Gallery"
      >
        {/* Top Bar */}
        <div className="sticky top-0 z-20 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 px-6 md:px-10 py-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white font-['Space_Grotesk']">
              Flyer Designs Archive
            </h2>
            <p className="text-xs text-neutral-400 tabular-nums">
              {flyerProjects.length} {flyerProjects.length === 1 ? 'Design' : 'Designs'} · Select any flyer for lightbox &amp; zoom
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 hover:text-white hover:bg-neutral-800 transition-colors flex items-center gap-2 text-xs font-semibold cursor-pointer min-h-[44px]"
          >
            <X className="w-4 h-4" />
            <span>Close Gallery</span>
          </button>
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 w-full flex-1">
          {flyerProjects.length === 0 ? (
            <div className="text-center py-20 text-neutral-400 text-sm">
              No flyer projects uploaded yet. Add a project under the Flyers category in Admin.
            </div>
          ) : (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {flyerProjects.map((proj, idx) => (
                <button
                  key={proj.id}
                  type="button"
                  onClick={() => setSelectedIndex(idx)}
                  className="break-inside-avoid w-full text-left glass-card rounded-2xl overflow-hidden border border-white/10 group cursor-pointer hover:border-violet-500/50 transition-all block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                >
                  <div className="relative bg-neutral-900 overflow-hidden">
                    <img
                      src={proj.image_url}
                      alt={proj.title}
                      loading="lazy"
                      className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-neutral-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-3.5 py-2 rounded-xl bg-white text-neutral-950 font-semibold text-xs flex items-center gap-1.5 shadow-xl">
                        <ZoomIn className="w-3.5 h-3.5" />
                        Inspect
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-xs text-neutral-400 mb-1 flex items-center gap-1.5 tabular-nums">
                      <span>{proj.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{proj.year}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white font-['Space_Grotesk'] group-hover:text-violet-300 transition-colors">
                      {proj.title}
                    </h3>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Viewer */}
        {selectedProject && (
          <div
            className="fixed inset-0 z-50 bg-neutral-950/98 backdrop-blur-3xl flex items-center justify-center p-4 md:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={selectedProject.title}
          >
            {/* Top Controls */}
            <div className="absolute top-5 right-5 z-30 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomed((z) => !z)}
                className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={zoomed ? 'Zoom out' : 'Zoom in'}
                title={zoomed ? 'Zoom out' : 'Zoom in'}
              >
                {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="p-3 rounded-full bg-neutral-900 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Previous */}
            {flyerProjects.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) =>
                    prev !== null && prev > 0 ? prev - 1 : flyerProjects.length - 1
                  )
                }
                className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-neutral-900/90 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Previous Flyer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Next */}
            {flyerProjects.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setSelectedIndex((prev) =>
                    prev !== null && prev < flyerProjects.length - 1 ? prev + 1 : 0
                  )
                }
                className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-neutral-900/90 border border-neutral-800 text-white hover:bg-neutral-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Next Flyer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Lightbox Content */}
            <div className="max-w-5xl w-full max-h-[88vh] glass-panel rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-12 shadow-2xl">
              <div
                onClick={() => setZoomed((z) => !z)}
                className="md:col-span-7 bg-neutral-900 flex items-center justify-center p-6 overflow-auto max-h-[60vh] md:max-h-[85vh] cursor-zoom-in"
              >
                <img
                  src={selectedProject.image_url}
                  alt={selectedProject.title}
                  className={`max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 ${
                    zoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                  }`}
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="md:col-span-5 p-8 flex flex-col justify-between bg-neutral-950 overflow-y-auto">
                <div>
                  <div className="flex items-center gap-2 text-xs text-neutral-400 mb-3 tabular-nums">
                    <span className="text-violet-400 font-semibold">{selectedProject.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedProject.year}
                    </span>
                  </div>

                  <h3 className="text-2xl font-extrabold text-white font-['Space_Grotesk'] mb-4">
                    {selectedProject.title}
                  </h3>

                  <p className="text-neutral-300 text-sm leading-relaxed mb-6">
                    {selectedProject.description}
                  </p>

                  {selectedProject.client && (
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <User className="w-4 h-4 text-violet-400" />
                      <span>
                        Client: <strong className="text-white">{selectedProject.client}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t border-neutral-900 flex items-center justify-between text-xs text-neutral-400">
                  <span>Click image to {zoomed ? 'reset' : 'zoom'}</span>
                  <span>← → Navigate · ESC Close</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
