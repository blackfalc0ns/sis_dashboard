import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Input from "../Input";

function PasswordInput() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Input
      label="Password"
      type={isVisible ? "text" : "password"}
      rightIcon={
        <button
          type="button"
          aria-label={isVisible ? "Hide password" : "Show password"}
          onClick={() => setIsVisible((current) => !current)}
        >
          Toggle
        </button>
      }
    />
  );
}

describe("Input", () => {
  it("allows interactive right icons to receive clicks", async () => {
    const user = userEvent.setup();
    render(<PasswordInput />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });
});
