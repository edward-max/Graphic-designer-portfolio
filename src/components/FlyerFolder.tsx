import React, { useState } from 'react';
import { Folder, Layers, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Project } from '../types';

interface FlyerFolderProps {
  flyerProjects: Project[];
  onOpenGallery: () => void;
}

export const FlyerFolder: React.FC<FlyerFolderProps> = ({ flyerProjects, onOpenGallery }) => {
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, hovered: false });
  const count = flyerProjects.length;
  const previewFlyers = flyerProjects.slice(0, 3);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({
      rotateX: -y * 10,
      rotateY: x * 12,
      hovered: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rotateX: 0, rotateY: 0, hovered: false });
  };

  return (
    <section className="py-20 bg-gradient-to-b from-neutral-950 to-neutral-900/70 border-t border-b border-neutral-900 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[300px] bg-violet-600/12 rounded-full blur-[110px] pointer-events-none"
      />

      <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Info */}
            <div className="lg:col-span-6 flex flex-col items-start">
              <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
                Interactive Archive
              </p>

              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight mb-4">
                The Flyer Designs Folder
              </h2>

              <p className="text-neutral-300 text-base leading-relaxed mb-8 max-w-xl">
                Every event flyer, club poster, and campaign visual is organized inside this interactive glass archive. Click the folder to launch the full-screen gallery viewer.
              </p>

              <div className="flex flex-wrap items-center gap-6 mb-8 text-sm">
                <div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk'] tabular-nums">
                    {count} {count === 1 ? 'Project' : 'Projects'}
                  </div>
                  <div className="text-xs text-neutral-400">Stored in Folder</div>
                </div>
                <div className="w-[1px] h-8 bg-neutral-800" />
                <div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk']">
                    Lightbox
                  </div>
                  <div className="text-xs text-neutral-400">Zoom &amp; Keyboard Nav</div>
                </div>
              </div>

              <button
                type="button"
                onClick={onOpenGallery}
                className="px-7 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors shadow-xl shadow-violet-600/25 flex items-center gap-3 group/btn cursor-pointer min-h-[44px]"
              >
                <span>Open Flyer Gallery</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right Interactive 3D Transparent Glass Folder */}
            <div className="lg:col-span-6 flex items-center justify-center" style={{ perspective: '1100px' }}>
              <motion.div
                role="button"
                tabIndex={0}
                data-cursor="folder"
                aria-label={`Open Flyer Designs folder with ${count} projects`}
                onClick={onOpenGallery}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenGallery();
                  }
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                animate={{
                  rotateX: tilt.rotateX,
                  rotateY: tilt.rotateY,
                  scale: tilt.hovered ? 1.03 : 1,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="w-full max-w-md relative cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-3xl"
              >
                {/* Realistic Folder Top Tab */}
                <div className="w-40 h-7 rounded-t-2xl bg-white/10 backdrop-blur-xl border border-b-0 border-white/20 ml-4 px-4 flex items-center">
                  <span className="text-[10px] font-semibold tracking-widest text-neutral-200 uppercase">
                    Archive · 01
                  </span>
                </div>

                {/* Folder Body Case */}
                <div
                  className={`glass-folder rounded-3xl rounded-tl-none p-6 relative overflow-hidden transition-shadow duration-300 ${
                    tilt.hovered
                      ? 'shadow-[0_30px_70px_-15px_rgba(139,92,246,0.45)] border-violet-400/40'
                      : ''
                  }`}
                >
                  {/* Subtle glass specular sheen */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-tr from-white/[0.04] via-white/[0.1] to-transparent pointer-events-none"
                  />

                  {/* Folder Header */}
                  <div className="relative z-10 flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-violet-200">
                        <Folder className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-wider font-['Space_Grotesk']">
                          FLYER DESIGNS
                        </h3>
                        <p className="text-xs text-violet-200 font-medium tabular-nums">
                          {count} {count === 1 ? 'Project' : 'Projects'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inner Flyer Sheets that Shift on Hover */}
                  <div className="relative z-10 grid grid-cols-3 gap-3 my-3">
                    {previewFlyers.length > 0 ? (
                      previewFlyers.map((proj, idx) => (
                        <motion.div
                          key={proj.id}
                          animate={{
                            y: tilt.hovered ? (idx === 1 ? -10 : -4) : 0,
                            rotate: tilt.hovered ? (idx - 1) * 3 : 0,
                          }}
                          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                          className="aspect-[3/4] rounded-xl overflow-hidden border border-white/15 bg-neutral-900 shadow-lg relative"
                        >
                          <img
                            src={proj.image_url}
                            alt={proj.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                            <span className="text-[10px] text-white font-medium truncate">
                              {proj.title}
                            </span>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-3 py-10 text-center text-xs text-neutral-300">
                        Add Flyer projects in Admin CMS to populate this folder.
                      </div>
                    )}
                  </div>

                  {/* Folder Footer */}
                  <div className="relative z-10 flex items-center justify-between pt-4 mt-2 border-t border-white/15 text-xs text-neutral-200">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Layers className="w-3.5 h-3.5 text-violet-300" />
                      Click to open full-screen gallery
                    </span>
                    <span aria-hidden="true" className="text-violet-300 font-semibold">
                      →
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
