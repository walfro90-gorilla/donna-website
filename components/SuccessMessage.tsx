// components/SuccessMessage.tsx
"use client";

interface SuccessMessageProps {
  message: string;
  className?: string;
  id?: string;
}

export default function SuccessMessage({ message, className = '', id }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div
      id={id}
      className={`field-message field-message-success ${className}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="field-message-icon"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}
