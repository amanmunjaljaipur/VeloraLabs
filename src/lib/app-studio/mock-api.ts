/**
 * Client-side mock API for Studio interactive apps.
 * Simulates latency, success, and failure so demos show both happy and failed paths.
 */

export type MockPathMode = "auto" | "always_ok" | "always_fail";

export type MockResult<T> =
  | { ok: true; data: T; message: string; latencyMs: number }
  | { ok: false; error: string; code: string; latencyMs: number };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Decide if this call should fail.
 * - always_ok / always_fail: global demo toggle
 * - auto: use shouldFailFn or "fail" markers in payload
 */
export function resolveShouldFail(
  mode: MockPathMode,
  payload: unknown,
  shouldFailFn?: (payload: unknown) => boolean
): boolean {
  if (mode === "always_ok") return false;
  if (mode === "always_fail") return true;
  if (shouldFailFn?.(payload)) return true;
  const s = JSON.stringify(payload ?? {}).toLowerCase();
  // Explicit negative-test markers users can type
  if (/\bfail\b|always.?fail|force.?fail|blocked@|fail@/.test(s)) return true;
  return false;
}

/**
 * Mock REST-style call with latency + pass/fail.
 */
export async function mockApiCall<T>(input: {
  /** Logical endpoint e.g. POST /support/cases */
  endpoint: string;
  payload?: unknown;
  mode?: MockPathMode;
  /** ms latency (default 400–900 random) */
  delayMs?: number;
  shouldFail?: (payload: unknown) => boolean;
  failMessage?: string;
  failCode?: string;
  successMessage?: string;
  onSuccess: () => T | Promise<T>;
}): Promise<MockResult<T>> {
  const delay =
    input.delayMs ?? 350 + Math.floor(Math.random() * 550);
  const t0 = Date.now();
  await sleep(delay);
  const latencyMs = Date.now() - t0;
  const mode = input.mode || "auto";
  const fail = resolveShouldFail(mode, input.payload, input.shouldFail);

  if (fail) {
    return {
      ok: false,
      error:
        input.failMessage ||
        `Mock API ${input.endpoint} failed (demo failure path)`,
      code: input.failCode || "MOCK_FAIL",
      latencyMs,
    };
  }

  try {
    const data = await input.onSuccess();
    return {
      ok: true,
      data,
      message:
        input.successMessage || `Mock API ${input.endpoint} succeeded`,
      latencyMs,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Unexpected mock error",
      code: "MOCK_EXCEPTION",
      latencyMs,
    };
  }
}
