import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import LoginAdvertisement from "~/pages/components/LoginAdvertisement";

describe("LoginAdvertisement", () => {
  it("renders without crashing", () => {
    render(<LoginAdvertisement />);
    expect(
      screen.getByText("Take control of your narrative."),
    ).toBeInTheDocument();
  });

  it("renders the video", () => {
    render(<LoginAdvertisement />);
    const videoElement = screen.getByText(
      "Your browser does not support the video tag.",
    );
    expect(videoElement).toBeInTheDocument();
  });
});

describe("LoginAdvertisement", () => {
  it("renders the logo", () => {
    render(<LoginAdvertisement />);
    const logoElement = screen.getByAltText("logo");
    expect(logoElement).toBeInTheDocument();
  });
});

describe("LoginAdvertisement", () => {
  it("renders the video with correct attributes", () => {
    render(<LoginAdvertisement />);
    const parentElement = screen.getByText(
      "Your browser does not support the video tag.",
    ).parentElement;
    if (parentElement && parentElement.firstChild) {
      const videoElement = parentElement.firstChild as HTMLVideoElement;
      expect(videoElement.muted).toBe(true);
      expect(videoElement.loop).toBe(true);
      expect(videoElement.autoplay).toBe(true);
    } else {
      throw new Error("Video element not found");
    }
  });
});
