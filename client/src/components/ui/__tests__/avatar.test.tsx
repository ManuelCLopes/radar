import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Avatar, AvatarImage, AvatarFallback } from "../avatar";

// Mock Radix UI Avatar primitives to test class application
vi.mock("@radix-ui/react-avatar", () => ({
    Root: ({ className, ...props }: any) => <div data-testid="avatar-root" className={className} {...props} />,
    Image: ({ className, ...props }: any) => <img data-testid="avatar-image" className={className} {...props} />,
    Fallback: ({ className, ...props }: any) => <div data-testid="avatar-fallback" className={className} {...props} />,
}));

describe("Avatar", () => {
    it("should render avatar root with correct classes", () => {
        render(
            <Avatar className="custom-class">
                <AvatarImage src="src" />
                <AvatarFallback>FB</AvatarFallback>
            </Avatar>
        );

        const root = screen.getByTestId("avatar-root");
        expect(root).toHaveClass("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full custom-class");
    });

    it("should render avatar image with correct classes", () => {
        render(
            <Avatar>
                <AvatarImage src="src" className="custom-img" />
            </Avatar>
        );

        const image = screen.getByTestId("avatar-image");
        expect(image).toHaveClass("aspect-square h-full w-full custom-img");
    });

    it("should render avatar fallback with correct classes", () => {
        render(
            <Avatar>
                <AvatarFallback className="custom-fallback">FB</AvatarFallback>
            </Avatar>
        );

        const fallback = screen.getByTestId("avatar-fallback");
        expect(fallback).toHaveClass("flex h-full w-full items-center justify-center rounded-full bg-muted custom-fallback");
    });
});
