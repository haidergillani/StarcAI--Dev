import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DocThumbnail from "~/pages/components/DocThumbnail";
import "@testing-library/jest-dom";
import Image from "next/image";
import documentIcon from "../../assets/document-icon.svg";
import trashIcon from "../../assets/trash-icon.svg";
import { useRouter } from "next/router";

jest.mock("next/router", () => ({
  useRouter: jest.fn(),
}));

// Create a mock push function
const mockPush = jest.fn();

// Mock Image component from 'next/image'
jest.mock("next/image", () =>
  jest.fn(() => {
    return "Image";
  }),
);

describe("DocThumbnail", () => {
  const mockDelete = jest.fn();
  const props = {
    id: 1,
    title: "Sample Document",
    wordCount: 100,
    onDelete: mockDelete,
  };

  it("renders document thumbnail with title and word count", () => {
    render(<DocThumbnail {...props} />);
    expect(screen.getByText("Sample Document")).toBeInTheDocument();
    expect(screen.getByText("100")).toBeInTheDocument();
  });

  it("triggers delete function on delete button click", () => {
    render(<DocThumbnail {...props} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockDelete).toHaveBeenCalledWith(1);
  });
});
