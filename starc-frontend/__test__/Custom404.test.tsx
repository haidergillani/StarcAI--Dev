// Only test of code is if it works, do with these files as you wish

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import NoContent from "../src/pages/components/Custom404";
import "@testing-library/jest-dom";

const mockBack = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

describe("Custom404", () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it("renders the 404 message and content", () => {
    render(<NoContent />);
    expect(screen.getByText("Oops!")).toBeInTheDocument();
    expect(screen.getByText("What are you doing here?")).toBeInTheDocument();
    
    // Test for text content that's split across multiple elements
    const container = screen.getByText(/future/, { exact: false }).closest('.w-380');
    expect(container).toHaveTextContent(/This page is a future functionality not in the scope of this assignment/);
    expect(container).toHaveTextContent(/Now go back to making your pitch perfect!/);
  });

  it("renders the images correctly", () => {
    render(<NoContent />);
    const oopsImage = screen.getByAltText("404");
    const backArrow = screen.getByAltText("back");
    
    expect(oopsImage).toBeInTheDocument();
    expect(backArrow).toBeInTheDocument();
    expect(oopsImage).toHaveAttribute("width", "500");
    expect(oopsImage).toHaveAttribute("height", "500");
    expect(backArrow).toHaveAttribute("width", "24");
    expect(backArrow).toHaveAttribute("height", "24");
  });

  it('navigates back when "Go Back" button is clicked', () => {
    render(<NoContent />);
    const goBackButton = screen.getByText("Go Back");
    
    fireEvent.click(goBackButton);
    expect(mockBack).toHaveBeenCalled();
  });
});
	
