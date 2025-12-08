import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableRow,
    TableHead,
    TableCell,
    TableCaption,
} from "../table";

describe("Table", () => {
    it("should render table", () => {
        render(
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell>Cell</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        );
        expect(screen.getByRole("table")).toBeInTheDocument();
    });

    it("should render table with header", () => {
        render(
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Header</TableHead>
                    </TableRow>
                </TableHeader>
            </Table>
        );
        expect(screen.getByText("Header")).toBeInTheDocument();
    });

    it("should render table with footer", () => {
        render(
            <Table>
                <TableFooter>
                    <TableRow>
                        <TableCell>Footer</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );
        expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("should render table with caption", () => {
        render(
            <Table>
                <TableCaption>Table Caption</TableCaption>
            </Table>
        );
        expect(screen.getByText("Table Caption")).toBeInTheDocument();
    });

    it("should apply custom className to table", () => {
        render(<Table className="custom-table"><tbody /></Table>);
        expect(screen.getByRole("table")).toHaveClass("custom-table");
    });

    it("should render complete table structure", () => {
        render(
            <Table>
                <TableCaption>A list of items</TableCaption>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell>Item 1</TableCell>
                        <TableCell>100</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>100</TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        );

        expect(screen.getByText("A list of items")).toBeInTheDocument();
        expect(screen.getByText("Name")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Total")).toBeInTheDocument();
    });
});
