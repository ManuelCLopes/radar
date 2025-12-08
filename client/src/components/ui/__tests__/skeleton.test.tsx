import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Skeleton } from "../skeleton";

describe("Skeleton", () => {
    it("should render skeleton", () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toBeInTheDocument();
    });

    it("should have animate-pulse class", () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton).toHaveClass("animate-pulse");
    });

    it("should have rounded-md class", () => {
        const { container } = render(<Skeleton />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton).toHaveClass("rounded-md");
    });

    it("should apply custom className", () => {
        const { container } = render(<Skeleton className="custom-skeleton" />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton).toHaveClass("custom-skeleton");
    });

    it("should accept custom dimensions via className", () => {
        const { container } = render(<Skeleton className="h-10 w-20" />);
        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton).toHaveClass("h-10");
        expect(skeleton).toHaveClass("w-20");
    });
});
