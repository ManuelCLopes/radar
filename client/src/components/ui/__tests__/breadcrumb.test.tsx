import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "../breadcrumb";

describe("Breadcrumb", () => {
    it("should render breadcrumb navigation", () => {
        render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );
        expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render breadcrumb links", () => {
        render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/">Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );

        expect(screen.getByText("Home")).toBeInTheDocument();
        expect(screen.getByText("Docs")).toBeInTheDocument();
    });

    it("should render current page", () => {
        render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbPage>Current Page</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );

        const currentPage = screen.getByText("Current Page");
        expect(currentPage).toHaveAttribute("aria-current", "page");
    });

    it("should render breadcrumb with separator", () => {
        const { container } = render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink>Docs</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );

        const separator = container.querySelector('[role="presentation"]');
        expect(separator).toBeInTheDocument();
    });

    it("should render breadcrumb ellipsis", () => {
        render(
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbEllipsis />
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
        );

        expect(screen.getByText("More")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
        const { container } = render(
            <Breadcrumb className="custom-breadcrumb">
                <BreadcrumbList />
            </Breadcrumb>
        );

        expect(container.querySelector("nav")).toHaveClass("custom-breadcrumb");
    });
});
