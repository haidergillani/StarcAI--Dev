import React from "react";
import { render, screen } from "@testing-library/react";
import LoginAdvertisement from "../src/pages/components/LoginAdvertisement";
import "@testing-library/jest-dom";

describe("LoginAdvertisement", () => {
  it("renders the login image", () => {
    render(<LoginAdvertisement />);
    const image = screen.getByAltText("logo");
    expect(image).toBeInTheDocument();
    expect(image).toHaveClass("h-full w-full");
  });

  it("renders with correct container styling", () => {
    render(<LoginAdvertisement />);
    const container = screen.getByAltText("logo").parentElement;
    expect(container).toHaveClass("h-full w-full");
  });
}); 