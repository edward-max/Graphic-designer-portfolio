import React from 'react';

interface FooterProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin, isAdminLoggedIn = false }) => {
  return (
    <footer className="py-10 bg-neutral-950 border-t border-neutral-900 text-neutral-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white tracking-tight font-['Space_Grotesk'] text-sm">
            KOBY
          </span>
          <span aria-hidden="true">·</span>
          <span>Graphic Designer · Visual Identity &amp; Digital Design</span>
        </div>

        <div>© {new Date().getFullYear()} Koby. All rights reserved.</div>

        <div className="flex flex-wrap items-center gap-5">
          <a href="#home" className="hover:text-white transition-colors">Home</a>
          <a href="#about" className="hover:text-white transition-colors">About</a>
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#portfolio" className="hover:text-white transition-colors">Portfolio</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-10 mt-6 pt-5 border-t border-neutral-900/70 flex justify-center">
        <button
          type="button"
          onClick={onOpenAdmin}
          className="px-4 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-300 hover:text-white hover:border-violet-500/40 opacity-50 hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer text-xs font-medium"
        >
          {isAdminLoggedIn ? 'CMS Admin' : 'Admin CMS'}
        </button>
      </div>
    </footer>
  );
};
