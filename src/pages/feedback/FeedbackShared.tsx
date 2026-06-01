import { ReactNode } from "react";

export const HEADER_BG = "#111872";
export const GOLD = "#E8A838";
export const SUBMIT_BG = "#0A2A92";

export function FeedbackHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header style={{ backgroundColor: HEADER_BG }} className="text-white py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-2xl font-bold tracking-wide" style={{ color: GOLD }}>
          UMCIMBI
        </div>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-white/80 text-sm sm:text-base">{subtitle}</p>
      </div>
    </header>
  );
}

export function FeedbackShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>;
}

export function ThankYou() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: HEADER_BG }}>
      <div className="text-center text-white max-w-lg">
        <h1 className="text-5xl sm:text-6xl font-bold mb-6" style={{ color: GOLD }}>
          Siyabonga! 🙏
        </h1>
        <p className="text-lg sm:text-xl text-white/90">
          Thank you for your feedback. It means a great deal to us as we build UMCIMBI for our community.
        </p>
      </div>
    </div>
  );
}

export function SubmitButton({ disabled, children }: { disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{ backgroundColor: SUBMIT_BG }}
      className="w-full text-white font-semibold py-3 rounded-md hover:opacity-90 disabled:opacity-60 transition"
    >
      {children}
    </button>
  );
}
