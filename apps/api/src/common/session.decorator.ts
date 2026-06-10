import { type ExecutionContext, createParamDecorator } from "@nestjs/common";
import type { Request } from "express";

export const SESSION_HEADER = "x-session-id";


export const SessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const header = request.headers[SESSION_HEADER];
    const value = Array.isArray(header) ? header[0] : header;
    return value?.trim() || "anonymous";
  },
);
