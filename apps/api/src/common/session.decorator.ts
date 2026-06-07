import { type ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";

/** Header carrying the anonymous browser-session id used to scope history. */
export const SESSION_HEADER = "x-session-id";

/**
 * Extracts the anonymous session id from the `X-Session-Id` header. There is no
 * auth yet; this id (a localStorage uuid from the client) scopes each browser's
 * history and maps cleanly to a real user id once accounts exist.
 */
export const SessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers[SESSION_HEADER];
    const value = Array.isArray(header) ? header[0] : header;
    return value?.trim() || "anonymous";
  },
);
