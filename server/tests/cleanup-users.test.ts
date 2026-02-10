
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
        const returningMock = vi.fn().mockResolvedValue([{ id: "user-1" }, { id: "user-2" }]);
        const whereMock = vi.fn().mockReturnValue({ returning: returningMock });
        const deleteMock = vi.fn().mockReturnValue({ where: whereMock });

        (db as any).delete = deleteMock;

        const count = await storage.deleteOldUnverifiedUsers(7);

        expect(db!.delete).toHaveBeenCalledWith(users);
        expect(whereMock).toHaveBeenCalled();
        expect(returningMock).toHaveBeenCalled();
        expect(count).toBe(2);
    });
});
