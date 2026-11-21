import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, Instagram, Linkedin, Facebook, AlertCircle } from 'lucide-react';
import { SiteSettings } from '../types';
import { createInquiryInFirestore } from '../firebase';

interface ContactSectionProps {
  settings: SiteSettings;
}

export const ContactSection: React.FC<ContactSectionProps> = ({ settings }) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    projectType: 'Flyer Design',
    budget: 'GH₵ 1,500 - GH₵ 3,500',
    message: '',
  });

  const cleanPhone = settings.whatsappNumber.replace(/[^\d]/g, '') || '15550192834';
  const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Hello Koby, I came across your portfolio and I'd like to discuss a design project with you."
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      await createInquiryInFirestore(formData);
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        projectType: 'Flyer Design',
        budget: 'GH₵ 1,500 - GH₵ 3,500',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 bg-neutral-900/40 border-t border-neutral-900 relative">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Info */}
          <div className="lg:col-span-5 flex flex-col items-start">
            <p className="text-xs font-semibold tracking-wider uppercase text-violet-400 mb-3">
              Start a Conversation
            </p>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white font-['Space_Grotesk'] tracking-tight mb-6">
              Have a project in mind? Let’s create something great.
            </h2>

            <p className="text-neutral-300 text-base leading-relaxed mb-8">
              Available for brand identity systems, event flyers, social media campaigns, and custom creative direction. Share your brief and I’ll respond within 24 hours.
            </p>

            <div className="flex flex-col gap-4 w-full">
              <a
                href={`mailto:${settings.email}`}
                className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-violet-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-neutral-400">Direct Email</div>
                  <div className="text-sm font-bold text-white group-hover:text-violet-300 truncate">
                    {settings.email}
                  </div>
                </div>
              </a>

              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="glass-card p-4 rounded-2xl border border-white/10 flex items-center gap-4 hover:border-emerald-500/40 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 text-[#25D366] flex items-center justify-center shrink-0">
                  <svg
                    viewBox="0 0 32 32"
                    className="w-5 h-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M16.004 2.667C8.652 2.667 2.67 8.649 2.67 16c0 2.35.614 4.645 1.781 6.666L2.667 29.333l6.829-1.79A13.285 13.285 0 0 0 16.004 29.333c7.352 0 13.333-5.982 13.333-13.333S23.356 2.667 16.004 2.667zm0 24.415a11.04 11.04 0 0 1-5.631-1.542l-.404-.24-4.053 1.063 1.082-3.951-.263-.419A11.024 11.024 0 0 1 4.922 16c0-6.11 4.972-11.082 11.082-11.082 6.111 0 11.082 4.972 11.082 11.082 0 6.11-4.971 11.082-11.082 11.082zm6.077-8.299c-.333-.167-1.97-.972-2.275-1.083-.305-.111-.527-.167-.75.167-.222.333-.861 1.083-1.055 1.305-.194.222-.389.25-.722.083-.333-.167-1.406-.518-2.678-1.653-.99-.883-1.658-1.974-1.852-2.307-.194-.333-.021-.513.146-.679.15-.149.333-.389.5-.583.167-.194.222-.333.333-.555.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.473-.271-.651-.546-.563-.75-.573-.194-.01-.417-.012-.639-.012-.222 0-.583.083-.889.417-.305.333-1.167 1.139-1.167 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.35 3.589 5.693 5.033.795.343 1.416.548 1.9.701.798.254 1.525.218 2.099.132.64-.096 1.97-.805 2.248-1.583.278-.778.278-1.445.194-1.583-.083-.139-.305-.222-.638-.389z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">WhatsApp Direct</div>
                  <div className="text-sm font-bold text-white group-hover:text-emerald-300 tabular-nums">
                    +{cleanPhone}
                  </div>
                </div>
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3 mt-8">
              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href={settings.behanceUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Behance"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors font-bold text-xs"
              >
                Bē
              </a>
              <a
                href={settings.facebookUrl || 'https://facebook.com'}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-11 h-11 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Right Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 sm:p-10 rounded-3xl relative shadow-2xl">
              {submitted ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-['Space_Grotesk'] mb-2">
                    Project Inquiry Received
                  </h3>
                  <p className="text-sm text-neutral-300 max-w-md mb-6">
                    Thank you for reaching out. Koby has received your brief and will follow up within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="px-5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white hover:bg-neutral-800 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {errorMsg && (
                    <div className="p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2"
                      >
                        Name
                      </label>
                      <input
                        id="contact-name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2"
                      >
                        Email
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-type"
                        className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2"
                      >
                        Project Type
                      </label>
                      <select
                        id="contact-type"
                        value={formData.projectType}
                        onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      >
                        <option value="Flyer Design">Flyer Design</option>
                        <option value="Brand Identity">Brand Identity</option>
                        <option value="Social Media Design">Social Media Design</option>
                        <option value="Poster Design">Poster Design</option>
                        <option value="Print Design">Print Design</option>
                        <option value="Creative Design">Creative Design</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="contact-budget"
                        className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2"
                      >
                        Budget (GH₵)
                      </label>
                      <select
                        id="contact-budget"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white focus:outline-none focus:border-violet-500 transition-colors text-sm"
                      >
                        <option value="GH₵ 500 - GH₵ 1,500">GH₵ 500 - GH₵ 1,500</option>
                        <option value="GH₵ 1,500 - GH₵ 3,500">GH₵ 1,500 - GH₵ 3,500</option>
                        <option value="GH₵ 3,500 - GH₵ 7,000">GH₵ 3,500 - GH₵ 7,000</option>
                        <option value="GH₵ 7,000+">GH₵ 7,000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tell Koby about your brand, deliverables, and timeline..."
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 transition-colors text-sm resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold text-sm transition-colors shadow-xl shadow-violet-600/25 flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    <span>{submitting ? 'Sending...' : 'Start a Project'}</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
