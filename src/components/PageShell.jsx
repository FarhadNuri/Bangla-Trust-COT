// Unified page shell providing consistent top bar, responsive width, and academic research footer
import { BrainCircuit } from "lucide-react";

export default function PageShell({ children, wide = false }) {
  const maxWidthClass = wide ? "max-w-7xl" : "max-w-3xl";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between overflow-x-hidden">
      {/* Slim top bar */}
      <header className="bg-white border-b border-slate-200">
        <div
          className={`mx-auto w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between ${maxWidthClass}`}
        >
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-800 text-sm sm:text-base">
              BanglaTrust-CoT Study
            </span>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Research Protocol
          </span>
        </div>
      </header>

      {/* Main content area */}
      <main
        className={`mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1 flex flex-col justify-center ${maxWidthClass}`}
      >
        {children}
      </main>

      {/* Academic confidentiality footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-4 text-center px-4">
        <p className="text-xs text-slate-600">
          Your answers are confidential and used only for academic research.
        </p>
      </footer>
    </div>
  );
}
