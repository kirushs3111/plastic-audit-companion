"use client";

import type { ReactNode } from "react";

type StepShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  onBack?: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

/**
 * Consistent chrome (eyebrow label, title, back button, footer slot) shared
 * by every step in the audit wizard, so individual step components only
 * need to implement their own question/input.
 */
export default function StepShell({
  eyebrow,
  title,
  description,
  onBack,
  children,
  footer,
}: StepShellProps) {
  return (
    <div className="max-w-2xl mx-auto w-full">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 hover:text-green-700 transition mb-6 inline-flex items-center gap-1"
        >
          ← Back
        </button>
      )}

      {eyebrow && (
        <p className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-2">
          {eyebrow}
        </p>
      )}

      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>

      {description && <p className="text-gray-600 mt-3">{description}</p>}

      <div className="mt-8">{children}</div>

      {footer && <div className="mt-10">{footer}</div>}
    </div>
  );
}
