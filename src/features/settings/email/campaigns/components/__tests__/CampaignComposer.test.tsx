import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CampaignComposer from "../CampaignComposer";

describe("CampaignComposer Sprint 11 behavior", () => {
  it("blocks credential-only variables in general campaigns", async () => {
    const user = userEvent.setup();
    const onPreviewRecipients = vi.fn();
    render(
      <CampaignComposer
        canManage
        roles={[]}
        recipientPreview={null}
        renderedPreview={null}
        createdBatch={null}
        isPreviewingRecipients={false}
        isPreviewingCampaign={false}
        isCreating={false}
        onPreviewRecipients={onPreviewRecipients}
        onPreviewCampaign={vi.fn()}
        onCreate={vi.fn()}
      />,
    );

    fireEvent.change(
      screen.getByRole("textbox", { name: /fields\.subject/ }),
      {
        target: { value: "Welcome" },
      },
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: /fields\.body_html/ }),
      {
        target: { value: "<p>{{credential.temporaryPassword}}</p>" },
      },
    );
    await user.click(
      screen.getByRole("button", { name: "actions.preview_recipients" }),
    );

    expect(
      screen.getByText(/validation\.credential_variables_blocked/),
    ).toBeInTheDocument();
    expect(onPreviewRecipients).not.toHaveBeenCalled();
  });
});
