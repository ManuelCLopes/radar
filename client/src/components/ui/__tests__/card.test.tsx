
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "../card";

describe("Card", () => {
    it("should render all card components", () => {
        render(
            <Card className="custom-card">
                <CardHeader className="custom-header">
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Description</CardDescription>
                </CardHeader>
                <CardContent className="custom-content">Card Content</CardContent>
                <CardFooter className="custom-footer">Card Footer</CardFooter>
            </Card>
        );

        expect(screen.getByText("Card Title")).toBeInTheDocument();
        expect(screen.getByText("Card Description")).toBeInTheDocument();
        expect(screen.getByText("Card Content")).toBeInTheDocument();
        expect(screen.getByText("Card Footer")).toBeInTheDocument();

        // Check classes
        expect(screen.getByText("Card Title").closest(".custom-card")).toBeInTheDocument();
        expect(screen.getByText("Card Title").closest(".custom-header")).toBeInTheDocument();
        expect(screen.getByText("Card Content").closest(".custom-content")).toBeInTheDocument();
        expect(screen.getByText("Card Footer").closest(".custom-footer")).toBeInTheDocument();
    });
});
