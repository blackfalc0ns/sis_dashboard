# School Logo Customization Design

## Goal

Extend the existing `SchoolLogoCropDialog` so an administrator can finish a school logo before upload. The selected image will retain the current square crop, movement, zoom, and rotation controls, and gain image adjustments, background treatment, and a simple frame. Every selected option is rendered into the uploaded file, so the logo looks the same throughout the product.

## Scope

The editor is shared by Settings Branding and the Organization onboarding step. It continues to accept only PNG and JPEG source files up to 5 MB and keeps the current upload API unchanged.

The customization set is intentionally bounded:

- Brightness, contrast, and saturation sliders, each with a neutral default.
- A small set of named filters: Original, Grayscale, Warm, and Cool.
- Background: transparent, white, or a user-selected solid color.
- Frame: square or circular output, with optional border color and a small border-width range.
- A Reset action that restores every crop and customization setting to its default.

Out of scope: text overlays, stickers, arbitrary drawing, saved presets, editing an existing uploaded logo without selecting a source image, and server-side image processing.

## Architecture

`SchoolLogoCropDialog` remains the presentation and interaction boundary. It will hold an explicit customization state object alongside the current crop state and pass that object to `createCroppedImage` on confirmation.

`cropImage.ts` owns all pixel work. After it applies crop and rotation, it will create a square output canvas, fill the selected background, draw the image with the chosen filter adjustments, then apply circular clipping or a square border as selected. PNG output remains PNG to preserve a transparent background; JPEG output remains JPEG, with transparent backgrounds flattened to white because JPEG does not support alpha.

The branding editor and upload hook continue to receive one processed `File`, so neither caller needs image-editing logic or API changes.

## Interaction and Accessibility

The dialog keeps the image preview first. A compact “Adjustments” panel follows it, containing labelled range inputs for brightness, contrast, saturation, and border width; labelled filter, background, and frame controls; and a Reset button. The preview updates immediately using CSS equivalents of the chosen adjustments; the final Canvas rendering uses the same values.

Defaults are Original filter, 100% brightness/contrast/saturation, transparent background for PNG, white for JPEG, square frame, and no border. Selecting a circular frame clips the final image to a circle; a transparent PNG keeps transparent corners. All controls are disabled while processing or uploading. Reset remains available whenever the dialog is otherwise idle and restores the crop, rotation, zoom, and every customization setting.

All controls receive localized visible labels and accessible names. The selected filter/frame/background controls expose their selected state to assistive technology, and errors keep the current `role="alert"` behaviour.

## Localization

Add matching English and Arabic copy for the Adjustments heading, Brightness, Contrast, Saturation, Filter, Background, Frame, Border color, Border width, Reset, each filter name, each background option, and square/circle options. Keep the existing crop-dialog copy intact.

## Testing

Add focused tests for:

- Default options producing the existing crop behaviour.
- Reset restoring all crop and customization defaults.
- Filter and adjustment values reaching the Canvas renderer.
- Transparent PNG versus JPEG background handling.
- Circular clipping and border rendering.
- The editor opening in both branding entry points and uploading only the rendered output after confirmation.
- English and Arabic translation coverage for the new labels.

Run the focused dialog, branding, onboarding, and translation tests, plus TypeScript, lint, and production build checks.
