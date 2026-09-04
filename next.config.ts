import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
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
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
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
