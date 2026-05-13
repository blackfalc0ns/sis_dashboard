import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EmailConnectionForm, {
  toEmailConnectionFormValues,
  toUpdateEmailConnectionRequest,
} from "../EmailConnectionForm";

const labels = {
  providerType: "Provider",
  fromName: "From name",
  fromEmail: "From email",
  replyToEmail: "Reply-to",
  host: "Host",
  port: "Port",
  secure: "Secure",
  username: "Username",
  password: "Password",
  apiKey: "API key",
  testRecipientEmail: "Test recipient",
  smtp: "SMTP",
  api: "API",
  configured: "Configured",
  notConfigured: "Not configured",
  secretHelp: "Leave blank to keep saved secret.",
};

describe("EmailConnectionForm Sprint 11 behavior", () => {
  it("does not display or resubmit raw saved secrets from GET responses", () => {
    const values = toEmailConnectionFormValues({
      id: "conn-1",
      providerType: "SMTP",
      status: "ACTIVE",
      fromName: "School",
      fromEmail: "school@example.edu",
      replyToEmail: null,
      host: "smtp.example.edu",
      port: 587,
      secure: true,
      username: "mailer",
      hasPassword: true,
      hasApiKey: true,
      encryptedPassword: "encrypted-password",
      encryptedApiKey: "encrypted-api-key",
    } as never);

    render(
      <EmailConnectionForm
        values={values}
        canManage
        hasPassword
        hasApiKey
        onChange={vi.fn()}
        labels={labels}
      />,
    );

    expect(screen.getByText(/Password \(Configured\)/)).toBeInTheDocument();
    expect(screen.getByText(/API key \(Configured\)/)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("encrypted-password")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("encrypted-api-key")).not.toBeInTheDocument();
    expect(toUpdateEmailConnectionRequest(values)).not.toMatchObject({
      password: expect.any(String),
      apiKey: expect.any(String),
    });
  });
});
