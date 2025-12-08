import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "../pagination";

describe("Pagination", () => {
    it("should render pagination nav", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        expect(screen.getByRole("navigation")).toBeInTheDocument();
    });

    it("should render pagination links", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#" isActive>2</PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should render previous button", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious href="#" />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        expect(screen.getByText("Previous")).toBeInTheDocument();
    });

    it("should render next button", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationNext href="#" />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        expect(screen.getByText("Next")).toBeInTheDocument();
    });

    it("should render ellipsis", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationEllipsis />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        expect(screen.getByText("More pages")).toBeInTheDocument();
    });

    it("should mark active page", () => {
        render(
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <PaginationLink href="#" isActive>2</PaginationLink>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        );
        const activeLink = screen.getByText("2");
        expect(activeLink).toHaveAttribute("aria-current", "page");
    });
});
