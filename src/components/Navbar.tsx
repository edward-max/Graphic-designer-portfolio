import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Services', href: '#services' },
    { name: 'Portfolio', href: '#portfolio' },
    { name: 'Process', href: '#process' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-neutral-950/90 backdrop-blur-md border-b border-white/10 py-3 shadow-xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <a
          href="#home"
          className="text-xl font-bold tracking-tight text-white font-['Space_Grotesk'] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded-md px-1"
        >
          KOBY
        </a>

        {/* Zone 2: Clean single-line navigation links */}
        <nav aria-label="Primary Navigation" className="hidden lg:flex items-center gap-7">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-neutral-300 hover:text-white transition-colors relative py-1 whitespace-nowrap shrink-0 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-violet-400 hover:after:w-full after:transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 rounded"
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary Action */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          <a
            href="#contact"
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
          >
            Let’s Talk
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden text-neutral-200 hover:text-white p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl border border-neutral-800 bg-neutral-900/70"
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-neutral-950/95 backdrop-blur-2xl border-b border-neutral-800 px-6 py-5 flex flex-col gap-1 shadow-2xl">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-neutral-200 hover:text-violet-300 py-3 border-b border-neutral-900 min-h-[44px] flex items-center"
            >
              {link.name}
            </a>
          ))}
          <div className="flex flex-col gap-3 pt-4">
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full min-h-[44px] py-3 px-4 text-sm font-semibold rounded-xl bg-white text-neutral-950 text-center flex items-center justify-center"
            >
              Let’s Work Together
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
