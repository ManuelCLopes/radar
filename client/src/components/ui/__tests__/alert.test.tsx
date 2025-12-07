
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Alert, AlertTitle, AlertDescription } from "../alert";

describe("Alert", () => {
    it("should render alert with title and description", () => {
        render(
            <Alert>
                <AlertTitle>Alert Title</AlertTitle>
                <AlertDescription>Alert Description</AlertDescription>
            </Alert>
        );

        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText("Alert Title")).toBeInTheDocument();
        expect(screen.getByText("Alert Description")).toBeInTheDocument();
    });

    it("should render destructive variant", () => {
        render(
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong</AlertDescription>
            </Alert>
        );

        const alert = screen.getByRole("alert");
        expect(alert).toHaveClass("border-destructive/50");
        expect(alert).toHaveClass("text-destructive");
    });
});
