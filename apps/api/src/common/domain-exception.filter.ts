import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { InvalidAppStoreUrlError } from "@aso/core";
import type { Response } from "express";
import { AppNotFoundError } from "../appstore/apple-lookup.client";

/**
 * Maps domain errors to meaningful HTTP responses so the API never leaks raw
 * stack traces and the client gets actionable status codes.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    const { status, message } = this.resolve(exception);
    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    }
    response.status(status).json({ statusCode: status, message });
  }

  private resolve(exception: unknown): { status: number; message: string } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message =
        typeof res === "string" ? res : ((res as { message?: string }).message ?? exception.message);
      return { status: exception.getStatus(), message };
    }
    if (exception instanceof InvalidAppStoreUrlError) {
      return { status: HttpStatus.BAD_REQUEST, message: exception.message };
    }
    if (exception instanceof AppNotFoundError) {
      return { status: HttpStatus.NOT_FOUND, message: exception.message };
    }
    const message = exception instanceof Error ? exception.message : "Internal server error";
    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message };
  }
}
