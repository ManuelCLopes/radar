import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AspectRatio } from "../aspect-ratio";

describe("AspectRatio", () => {
    it("should render with default ratio", () => {
        const { container } = render(
            <AspectRatio>
                <div>Content</div>
            </AspectRatio>
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it("should render with 16/9 ratio", () => {
        const { container } = render(
            <AspectRatio ratio={16 / 9}>
                <img src="test.jpg" alt="test" />
            </AspectRatio>
        );
        expect(container.querySelector("img")).toBeInTheDocument();
    });

    it("should render with 4/3 ratio", () => {
        const { container } = render(
            <AspectRatio ratio={4 / 3}>
                <div>Content</div>
            </AspectRatio>
        );
        expect(container.firstChild).toBeInTheDocument();
    });
});
