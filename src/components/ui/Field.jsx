// Form field wrapper pairing a label, optional hint, children input, and error message
export default function Field({
  label,
  hint,
  error,
  htmlFor,
  required = false,
  children,
}) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-sm font-semibold text-slate-800"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {hint && <p className="text-xs text-slate-600 leading-normal">{hint}</p>}
      <div>{children}</div>
      {error && <p className="mt-1 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
