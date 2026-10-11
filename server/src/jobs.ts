// Long content jobs (an editorial can take a few minutes) run in the background so no
// proxy timeout cuts them off. The browser polls /api/jobs/:id for the result.
import { randomUUID } from "node:crypto";

export interface Job {
  id: string;
  name: string;
  status: "running" | "done" | "failed";
  startedAt: number;
  finishedAt?: number;
  result?: unknown;
  error?: string;
}

const jobs = new Map<string, Job>();

/** Starts `name` unless the same job is already running, in which case that one is returned. */
export function startJob(name: string, run: () => Promise<unknown>): Job {
  for (const job of jobs.values()) if (job.name === name && job.status === "running") return job;

  const job: Job = { id: randomUUID(), name, status: "running", startedAt: Date.now() };
  jobs.set(job.id, job);
  run()
    .then((result) => Object.assign(job, { status: "done", result, finishedAt: Date.now() }))
    .catch((err) => {
      console.error(`[job] ${name} failed:`, err);
      Object.assign(job, { status: "failed", error: err instanceof Error ? err.message : String(err), finishedAt: Date.now() });
    });

  // Forget finished jobs after an hour.
  const cutoff = Date.now() - 3600 * 1000;
  for (const [id, j] of jobs) if (j.finishedAt && j.finishedAt < cutoff) jobs.delete(id);
  return job;
}

export const getJob = (id: string) => jobs.get(id);
