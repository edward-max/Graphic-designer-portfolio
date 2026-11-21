import React from 'react';

interface WhatsAppButtonProps {
  phoneNumber: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phoneNumber }) => {
  const cleanPhone = phoneNumber.replace(/[^\d]/g, '') || '15550192834';
  const message = encodeURIComponent(
    "Hello Koby, I came across your portfolio and I'd like to discuss a design project with you."
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-2xl hover:bg-[#20bd5a] transition-transform hover:scale-105 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      title="Chat on WhatsApp"
      aria-label="Chat with Koby on WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        className="w-7 h-7 fill-current"
        aria-hidden="true"
      >
        <path d="M16.004 2.667C8.652 2.667 2.67 8.649 2.67 16c0 2.35.614 4.645 1.781 6.666L2.667 29.333l6.829-1.79A13.285 13.285 0 0 0 16.004 29.333c7.352 0 13.333-5.982 13.333-13.333S23.356 2.667 16.004 2.667zm0 24.415a11.04 11.04 0 0 1-5.631-1.542l-.404-.24-4.053 1.063 1.082-3.951-.263-.419A11.024 11.024 0 0 1 4.922 16c0-6.11 4.972-11.082 11.082-11.082 6.111 0 11.082 4.972 11.082 11.082 0 6.11-4.971 11.082-11.082 11.082zm6.077-8.299c-.333-.167-1.97-.972-2.275-1.083-.305-.111-.527-.167-.75.167-.222.333-.861 1.083-1.055 1.305-.194.222-.389.25-.722.083-.333-.167-1.406-.518-2.678-1.653-.99-.883-1.658-1.974-1.852-2.307-.194-.333-.021-.513.146-.679.15-.149.333-.389.5-.583.167-.194.222-.333.333-.555.111-.222.056-.417-.028-.583-.083-.167-.75-1.806-1.028-2.473-.271-.651-.546-.563-.75-.573-.194-.01-.417-.012-.639-.012-.222 0-.583.083-.889.417-.305.333-1.167 1.139-1.167 2.778 0 1.639 1.194 3.222 1.361 3.444.167.222 2.35 3.589 5.693 5.033.795.343 1.416.548 1.9.701.798.254 1.525.218 2.099.132.64-.096 1.97-.805 2.248-1.583.278-.778.278-1.445.194-1.583-.083-.139-.305-.222-.638-.389z" />
      </svg>
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
        Chat on WhatsApp
      </span>
    </a>
  );
};
