import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal .next/standalone build the Dockerfile copies in -
  // without this, `docker build` succeeds but the image is missing the
  // server entrypoint.
  output: "standalone",
};

export default nextConfig;
