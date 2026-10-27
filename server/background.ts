import { waitUntil } from "@vercel/functions";

// Runs work after the response has been sent. On Vercel, waitUntil keeps the
// function alive until the promise settles (otherwise the instance can be
// frozen mid-task); elsewhere it simply lets the promise run.
export function runInBackground(task: Promise<unknown>, label: string): void {
    const guarded = task.catch((error) => {
        console.error(`[Background] ${label} failed:`, error);
    });
    try {
        waitUntil(guarded);
    } catch {
        // No request context (e.g. tests or the standalone server): the promise still runs.
    }
}
