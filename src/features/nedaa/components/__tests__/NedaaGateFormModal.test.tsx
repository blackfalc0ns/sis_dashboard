import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import NedaaGateFormModal from "../NedaaGateFormModal";

vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/ui/google-location-picker", () => ({
  GoogleLocationPicker: ({
    onChange,
    onValidityChange,
  }: {
    onChange: (value: {
      latitude: number;
      longitude: number;
      label: string;
      formattedAddress: string;
    }) => void;
    onValidityChange: (valid: boolean) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onChange({
            latitude: 24.7136,
            longitude: 46.6753,
            label: "North Gate",
            formattedAddress: "Riyadh",
          })
        }
      >
        select-test-location
      </button>
      <button type="button" onClick={() => onValidityChange(false)}>
        invalidate-test-location
      </button>
    </div>
  ),
}));

function renderModal(onSubmit = vi.fn()) {
  render(
    <NedaaGateFormModal
      isOpen
      mode="create"
      existingGateIds={[]}
      onClose={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("NedaaGateFormModal location", () => {
  it("submits coordinates selected in the location picker", async () => {
    const user = userEvent.setup();
    const onSubmit = renderModal();
    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "North Gate",
    );
    await user.click(
      screen.getByRole("button", { name: "select-test-location" }),
    );
    await user.click(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    );

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: 24.7136, longitude: 46.6753 }),
    );
  });

  it("blocks submission while coordinates are invalid", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.type(
      screen.getByLabelText("settings.gate_form.name_en"),
      "North Gate",
    );
    await user.click(
      screen.getByRole("button", { name: "invalidate-test-location" }),
    );

    expect(
      screen.getByRole("button", {
        name: "settings.gate_form.create_action",
      }),
    ).toBeDisabled();
  });
});
