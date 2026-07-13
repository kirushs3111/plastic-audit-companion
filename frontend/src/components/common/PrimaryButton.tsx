"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type PrimaryButtonProps = {
  children: ReactNode;
  /** If provided, renders as a Next.js Link instead of a <button>. */
  href?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

const VARIANT_CLASSES: Record<NonNullable<PrimaryButtonProps["variant"]>, string> = {
  primary: "bg-green-600 hover:bg-green-700 text-white",
  secondary: "bg-blue-600 hover:bg-blue-700 text-white",
  outline: "bg-white hover:bg-green-50 text-green-700 border-2 border-green-600",
};

const SIZE_CLASSES: Record<NonNullable<PrimaryButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

/**
 * Reusable call-to-action button used across the landing page and, later,
 * the audit flow. Renders as a Next.js <Link> when `href` is provided,
 * otherwise as a native <button>.
 */
export default function PrimaryButton({
  children,
  href,
  onClick,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  className = "",
}: PrimaryButtonProps) {
  const classes = [
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold",
    "transition duration-200 shadow-sm hover:shadow-md",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    className,
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}
