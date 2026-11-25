// Contextual alert notification for error messages and informational callouts
export default function Alert({ children, variant = "error", className = "" }) {
  if (variant === "error") {
    return (
      <div
        role="alert"
        className={`rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-indigo-900 ${className}`}
    >
      {children}
    </div>
  );
}
