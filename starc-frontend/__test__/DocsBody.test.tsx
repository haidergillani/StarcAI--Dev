import React from "react";
import { render } from "@testing-library/react";
import DocsBody from "~/pages/components/DocsBody";

jest.mock("../src/pages/components/Menu", () => () => (
  <div data-testid="menu-mock"></div>
));
jest.mock("../src/pages/components/DocsContainer", () => () => (
  <div data-testid="docs-container-mock"></div>
));

describe("DocsBody", () => {
  it("renders the Menu component", () => {
    const { getByTestId } = render(<DocsBody />);
    expect(getByTestId("menu-mock")).toBeInTheDocument();
  });

  it("renders the DocsContainer component", () => {
    const { getByTestId } = render(<DocsBody />);
    expect(getByTestId("docs-container-mock")).toBeInTheDocument();
  });

  it("renders with correct layout structure", () => {
    const { container } = render(<DocsBody />);
    expect(container.firstChild).toHaveClass("flex h-screen w-screen");
    expect(container.firstChild.firstChild).toHaveClass(
      "w-208 bg-gray-20 p-83 pr-208",
    );
    expect(container.firstChild.lastChild).toHaveClass(
      "h-screen w-screen bg-white",
    );
  });
});
