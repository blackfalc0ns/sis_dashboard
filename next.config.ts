import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// TODO: Tighten CSP later by removing unsafe-inline and unsafe-eval after
// Next/MUI/Tailwind runtime requirements are audited.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.ggpht.com https://*.googleusercontent.com blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: https://*.googleapis.com https://*.gstatic.com https://*.google.com https://*.googleusercontent.com http://storage.moazez.sa:9000",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https: wss: data: blob: https://*.googleapis.com https://*.gstatic.com https://*.google.com http://storage.moazez.sa:9000",
  "media-src 'self' blob:",
  "frame-src 'self' blob: https://*.google.com",
  "object-src 'self' blob:",
  "worker-src blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=(self)",
  },
  {
    key: "Content-Security-Policy",
    value: csp,
  },
];

if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains; preload",
  });
}

const nextConfig: NextConfig = {
  env: {
    API_URL: process.env.API_URL,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    GOOGLE_MAPS_MAP_ID: process.env.GOOGLE_MAPS_MAP_ID,
    REALTIME_URL: process.env.REALTIME_URL,
    REALTIME_SOCKET_PATH: process.env.REALTIME_SOCKET_PATH,
    REALTIME_DEBUG: process.env.REALTIME_DEBUG,
    MOBILE_APP_STUDENT_GOOGLE_PLAY_URL:
      process.env.MOBILE_APP_STUDENT_GOOGLE_PLAY_URL,
    MOBILE_APP_STUDENT_APP_STORE_URL:
      process.env.MOBILE_APP_STUDENT_APP_STORE_URL,
    MOBILE_APP_TEACHER_GOOGLE_PLAY_URL:
      process.env.MOBILE_APP_TEACHER_GOOGLE_PLAY_URL,
    MOBILE_APP_TEACHER_APP_STORE_URL:
      process.env.MOBILE_APP_TEACHER_APP_STORE_URL,
    MOBILE_APP_PARENT_GOOGLE_PLAY_URL:
      process.env.MOBILE_APP_PARENT_GOOGLE_PLAY_URL,
    MOBILE_APP_PARENT_APP_STORE_URL:
      process.env.MOBILE_APP_PARENT_APP_STORE_URL,
    MOBILE_APP_DISMISSAL_STAFF_GOOGLE_PLAY_URL:
      process.env.MOBILE_APP_DISMISSAL_STAFF_GOOGLE_PLAY_URL,
    MOBILE_APP_DISMISSAL_STAFF_APP_STORE_URL:
      process.env.MOBILE_APP_DISMISSAL_STAFF_APP_STORE_URL,
    DEFAULT_SCHOOL_ID: process.env.DEFAULT_SCHOOL_ID,
  },
  reactCompiler: {
    compilationMode: "annotation",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
        pathname: "/w40/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
