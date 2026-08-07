import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import type { Request } from "express";
import { SESSION_HEADER } from "./session.decorator";

/**
 * Rate-limits per browser session instead of per IP.
 *
 * The web app reaches this API through its own server-side proxy, so every
 * request — from every visitor — arrives from a single outbound address. An
 * IP-keyed limit therefore degenerates into one global bucket that any single
 * user can exhaust for everyone. The session header is the only value that
 * actually distinguishes callers on that path.
 *
 * A client can rotate its session id to get a fresh bucket, so treat this as
 * protection against runaway clients and accidental loops, not as an
 * authorization control. The IP fallback still covers direct, header-less
 * callers.
 */
@Injectable()
export class SessionThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: Record<string, unknown>): Promise<string> {
    const request = req as unknown as Request;
    const header = request.headers?.[SESSION_HEADER];
    const session = (Array.isArray(header) ? header[0] : header)?.trim();
    return session ? `session:${session}` : `ip:${request.ip ?? "unknown"}`;
  }
}
