import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // cacheComponents disabled — project relies on external APIs not available at build time
  async redirects() {
    return [
      {
        source: "/noticias",
        destination: "/categorias/noticias",
        permanent: false,
      },
      {
        source: "/revista",
        destination: "/serbio/revista",
        permanent: false,
      },
    ];
  },
  images: {
    // unoptimized: true — evita que Next.js intente fetch local de imágenes
    // El navegador las carga directo desde admin.serbialatina.com vía Cloudflare (HTTPS)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "admin.segun2idioma.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "admin.serbialatina.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
