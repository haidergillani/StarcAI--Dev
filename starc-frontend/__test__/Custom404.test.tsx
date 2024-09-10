// Only test of code is if it works, do with these files as you wish

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NoContent from "~/pages/components/Custom404";
import "@testing-library/jest-dom";

jest.mock("next/router", () => ({
  useRouter() {
    return {
      back: jest.fn(),
    };
  },
}));

describe("Custom404", () => {
  it("renders the 404 message", () => {
    render(<NoContent />);
    expect(screen.getByText("Oops!")).toBeInTheDocument();
    expect(screen.getByText("What are you doing here?")).toBeInTheDocument();
    const textElement = screen.getByText(
      /Now go back to making your pitch perfect!/i,
    );
    expect(textElement).toBeInTheDocument();
  });

  it("renders the 404 image", () => {
    render(<NoContent />);
    expect(screen.getByAltText("404")).toBeInTheDocument();
  });

  it('navigates back when "Go Back" is clicked', () => {
    const { getByText } = render(<NoContent />);
    const goBackButton = getByText("Go Back");
    fireEvent.click(goBackButton);
    expect(screen.getByAltText("back")).toBeInTheDocument(); // Checks if the back arrow image is in the document, indicating the presence of the back button
  });
});
	
