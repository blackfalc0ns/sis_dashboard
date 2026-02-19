import localFont from "next/font/local";

// Cairo font with local files for offline builds
// Using woff2 format for better compression and performance
export const cairo = localFont({
  src: [
    // Latin subset
    {
      path: "../../public/fonts/cairo/cairo-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    // Arabic subset
    {
      path: "../../public/fonts/cairo/cairo-arabic-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-arabic-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-arabic-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/cairo/cairo-arabic-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-cairo",
  display: "swap",
  // Fallback to system fonts if Cairo is not available
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});
