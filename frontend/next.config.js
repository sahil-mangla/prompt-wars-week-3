/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export so `next build` produces an `out/` directory.
  // This is the Next.js 14 replacement for the deprecated `next export` command.
  // The Docker build copies this `out/` dir into the backend container at /public.
  output: 'export',

  // Disable image optimization (required for static export — no server to optimize at runtime).
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
