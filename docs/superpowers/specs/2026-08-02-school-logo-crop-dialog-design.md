# School Logo Crop Dialog Design

## Goal

Let an administrator prepare a school logo before it is uploaded. After selecting a valid image, they can crop a square region, move it, zoom it, and rotate it, then explicitly confirm the resulting image. The interaction should feel like a profile-photo editor: no upload occurs until confirmation.

## Scope

The behaviour applies anywhere `SchoolBrandingEditor` is rendered:

- Settings branding
- The Organization step during onboarding

Supported source files remain PNG and JPEG, at most 5 MB. The existing branding upload API and stored `SchoolProfileSettings.logoUrl` contract do not change.

Out of scope: filters, colour adjustments, freeform/aspect-ratio selection, editing a previously uploaded logo without selecting a new file, and server-side image processing.

## Architecture

Add `react-easy-crop` as the crop interaction dependency. Place the reusable UI in:

`src/components/ui/school-logo-crop-dialog/`

The folder contains `SchoolLogoCropDialog.tsx`, a `cropImage.ts` helper that renders the selected crop to a `File`, and any types exported only by those two modules. The dialog wraps the existing shared `Modal` primitive so it inherits the application's focus trap, focus restoration, Escape behaviour, RTL direction, and portal layout.

`SchoolLogoCropDialog` accepts a validated source `File`, localized copy, an open state, and callbacks for cancellation and confirmation. Its responsibility ends at producing the processed `File`; it does not call a branding API and has no school-specific state.

`SchoolBrandingEditor` owns the selected-file and dialog-open state. Its `DragDropUploadArea` callback validates as it does today, then opens the dialog instead of invoking `editor.uploadLogo` directly. The editor calls the existing `editor.uploadLogo([processedFile])` only after dialog confirmation.

## Interaction Flow

1. The user selects or drops a PNG or JPEG.
2. `DragDropUploadArea` rejects invalid type or files over 5 MB using its current validation behaviour. Valid files open the crop dialog without uploading.
3. The dialog shows a fixed 1:1 crop frame. The user can drag the image, adjust zoom, and rotate in 90-degree increments.
4. **Cancel**, close, overlay dismissal, or Escape discards the selected source file and leaves the currently saved logo unchanged.
5. **Confirm** renders only the square crop to a new file. PNG input produces PNG output so transparency is preserved; JPEG input produces JPEG output.
6. While rendering or calling the existing upload service, the dialog controls and uploader are disabled. On success, the current hook behaviour updates the saved profile and status. On rendering or upload failure, the selected/saved logo is retained and localized feedback is displayed.

The generated file's name is derived from the selected filename and the correct extension is used for its MIME type. The 5 MB input limit remains an input rule; the implementation must handle an output that exceeds the server's accepted limit by surfacing the existing upload failure state rather than silently uploading a different image.

## UI and Accessibility

The dialog uses a large modal layout. It contains the image canvas, a labelled zoom range input, a labelled rotation action showing its current rotation, and clearly separated Cancel and Confirm actions. The crop region is square and keyboard-accessible controls have visible focus.

The existing `Modal` handles focus trapping, restoration, and Escape. Confirmation is disabled while an image is being rendered or uploaded. The dialog must provide accessible names for the crop controls and its loading state; errors are announced with the same `role="alert"` convention used by the branding editor.

## Localization

Add matching Arabic and English keys under the shared branding-editor copy for:

- Dialog title and instruction
- Zoom label
- Rotate action and rotation status
- Cancel and confirm actions
- Preparing/uploading status
- Image-preparation failure

Reuse existing upload success/failure messages where their wording remains accurate. Update `src/messages/__tests__/onboardingTranslations.test.ts` so key parity continues to cover the new copy.

## Testing

Add focused tests for the dialog and branding integration:

- Valid file selection opens the dialog and makes no API call.
- Cancellation, the close affordance, and Escape do not upload or replace the existing logo.
- Confirmation passes a square processed PNG/JPEG file to the existing upload flow and the returned profile still updates the UI.
- Zoom, movement, and 90-degree rotation update crop state; image processing errors expose localized feedback and preserve the source state.
- The controls are disabled while processing/uploading and duplicate confirmation cannot start a second upload.
- Existing Settings Branding and Organization onboarding tests verify the shared editor integration.
- Translation parity tests cover all new English and Arabic keys.

Run the relevant component/hook/translation tests, TypeScript checking, linting, and the full Vitest suite before considering the implementation complete.
