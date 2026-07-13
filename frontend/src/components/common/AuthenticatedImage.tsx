"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

type AuthenticatedImageProps = {
  path: string; // e.g. "/api/photos/{id}/file"
  alt: string;
  className?: string;
};

/**
 * Photos require an Authorization header to view (only the owner or an
 * admin can access them) - a plain <img src="..."> can't send custom
 * headers, so this fetches the bytes with the bearer token and renders
 * them as a blob URL instead.
 */
export default function AuthenticatedImage({ path, alt, className }: AuthenticatedImageProps) {
  const { token } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load photo");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path, token]);

  if (failed) {
    return (
      <div className={`${className} bg-gray-100 flex items-center justify-center text-gray-400 text-xs`}>
        Failed to load
      </div>
    );
  }

  if (!blobUrl) {
    return <div className={`${className} bg-gray-100 animate-pulse`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={blobUrl} alt={alt} className={className} />;
}
