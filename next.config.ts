import type { NextConfig } from "next";

const nextConfig: NextConfig = {
<<<<<<< HEAD
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
=======
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            // Google/Firebase popup 로그인이 원래 창으로 결과를 돌려주게 함
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
>>>>>>> origin/seohyeon_logIn
  },
};

export default nextConfig;
