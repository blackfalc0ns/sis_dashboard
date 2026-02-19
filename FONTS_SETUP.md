# Font Setup Guide

This project uses local fonts for deterministic offline builds. This ensures builds work offline and produce consistent output every time.

## Current Status

✅ Local fonts configured and working
✅ Migrated from `middleware.ts` to `proxy.ts` (Next.js 16+ convention)
✅ Using woff2 format for optimal performance
✅ All font files copied from @fontsource/cairo

## Quick Setup

### Option 1: Automatic Download (Recommended)

Run the download script:

```bash
npm run download-fonts
```

This will automatically download the required Cairo font files from Google Fonts.

### Option 2: Manual Download

If the automatic download fails, follow these steps:

1. **Visit Google Fonts:**
   - Go to https://fonts.google.com/specimen/Cairo
   - Click the "Download family" button

2. **Extract and Copy:**
   - Extract the downloaded ZIP file
   - Copy these files to `public/fonts/cairo/`:
     - `Cairo-Regular.ttf`
     - `Cairo-Medium.ttf`
     - `Cairo-SemiBold.ttf`
     - `Cairo-Bold.ttf`

3. **Verify:**
   ```bash
   ls public/fonts/cairo/
   ```
   You should see the 4 `.ttf` files.

### Option 3: Using @fontsource Package

Install the fontsource package:

```bash
npm install @fontsource/cairo
```

Then copy the font files:

```bash
# On Windows (PowerShell)
Copy-Item node_modules/@fontsource/cairo/files/*.ttf public/fonts/cairo/

# On macOS/Linux
cp node_modules/@fontsource/cairo/files/*.ttf public/fonts/cairo/
```

## Why Local Fonts?

### Benefits

1. **Offline Builds**: No internet connection required during build time
2. **Deterministic Builds**: Same build output every time
3. **Better Performance**: Fonts are bundled with the app
4. **Privacy**: No external requests to Google servers
5. **Reliability**: No dependency on external CDN availability

### Migration from Google Fonts

We migrated from `next/font/google` to `next/font/local` to address:

- Build failures when offline
- Non-deterministic builds due to font CDN requests
- Potential privacy concerns with external font loading

## Font Configuration

The font configuration is located in `src/lib/fonts.ts`:

```typescript
import localFont from "next/font/local";

export const cairo = localFont({
  src: [
    { path: "../../public/fonts/cairo/Cairo-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/cairo/Cairo-Medium.ttf", weight: "500" },
    { path: "../../public/fonts/cairo/Cairo-SemiBold.ttf", weight: "600" },
    { path: "../../public/fonts/cairo/Cairo-Bold.ttf", weight: "700" },
  ],
  variable: "--font-cairo",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});
```

## Fallback Fonts

If the Cairo font files are not available, the application will fall back to system fonts:

- `system-ui`
- `-apple-system`
- `Segoe UI`
- `Roboto`
- `sans-serif`

This ensures the application works even without the font files, though the typography may differ.

## Troubleshooting

### Build Error: Cannot find font files

**Error:**

```
Error: Can't resolve '../../public/fonts/cairo/Cairo-Regular.ttf'
```

**Solution:**
Make sure you've downloaded the font files using one of the methods above.

### Fonts not loading in development

**Solution:**

1. Restart the development server: `npm run dev`
2. Clear Next.js cache: `rm -rf .next`
3. Verify font files exist in `public/fonts/cairo/`

### Different font rendering

If fonts look different after migration, ensure:

1. All 4 font weights are present (400, 500, 600, 700)
2. Font files are not corrupted
3. CSS is using the correct font-family variable

## Adding More Fonts

To add additional fonts:

1. Create a new directory in `public/fonts/`
2. Add font files to the directory
3. Update `src/lib/fonts.ts` with the new font configuration
4. Import and use in your layout files

Example:

```typescript
// src/lib/fonts.ts
export const myFont = localFont({
  src: [
    { path: "../../public/fonts/myfont/MyFont-Regular.ttf", weight: "400" },
  ],
  variable: "--font-myfont",
});

// src/app/layout.tsx
import { cairo, myFont } from "@/lib/fonts";

<body className={`${cairo.variable} ${myFont.variable}`}>
```

## Resources

- [Next.js Font Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
- [Google Fonts](https://fonts.google.com/)
- [Fontsource](https://fontsource.org/)
- [Google Webfonts Helper](https://gwfh.mranftl.com/)
