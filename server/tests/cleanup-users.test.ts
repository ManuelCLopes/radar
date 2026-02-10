
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DatabaseStorage } from "../storage";
import { db } from "../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Mock DB
vi.mock("../db", () => ({
    db: {
        delete: vi.fn(),
        select: vi.fn(),
        insert: vi.fn(),
        update: vi.fn()
    }
}));

describe("User Cleanup (DatabaseStorage)", () => {
    let storage: DatabaseStorage;

    beforeEach(() => {
        vi.clearAllMocks();
        storage = new DatabaseStorage();
    });

    it("should delete unverified users older than X days based on createdAt", async () => {
        const usersMock = [{ id: "user-1" }, { id: "user-2" }];
        const selectMock = vi.fn().mockReturnValue({
            from: vi.fn().mockReturnValue({
                where: vi.fn().mockResolvedValue(usersMock)
            })
        });

        const returningMock = vi.fn().mockResolvedValue(usersMock);
        const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
        const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

        (db as any).select = selectMock;
        (db as any).delete = deleteMock;

        const count = await storage.deleteOldUnverifiedUsers(7);

        // Verify select called
        expect(db!.select).toHaveBeenCalled();

        // Verify multiple deletes (apiUsage, businesses, reports, users)
        expect(deleteMock).toHaveBeenCalledTimes(4);

        expect(count).toBe(2);
    });
});
