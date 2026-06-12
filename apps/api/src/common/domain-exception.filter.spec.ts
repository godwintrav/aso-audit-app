import { InvalidAppStoreUrlError } from "@aso/core";
import {
  type ArgumentsHost,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppNotFoundError } from "../appstore/apple-lookup.client";
import { DomainExceptionFilter } from "./domain-exception.filter";

function mockHost() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

beforeEach(() => {
  vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DomainExceptionFilter", () => {
  it("maps an HttpException to its status and message", () => {
    const { host, status, json } = mockHost();
    new DomainExceptionFilter().catch(new ForbiddenException("nope"), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(json).toHaveBeenCalledWith({ statusCode: HttpStatus.FORBIDDEN, message: "nope" });
  });

  it("uses the exception message when an HttpException response is a plain string", () => {
    const { host, json } = mockHost();
    new DomainExceptionFilter().catch(new HttpException("boom", HttpStatus.BAD_GATEWAY), host);
    expect(json).toHaveBeenCalledWith({ statusCode: HttpStatus.BAD_GATEWAY, message: "boom" });
  });

  it("maps InvalidAppStoreUrlError to 400", () => {
    const { host, status, json } = mockHost();
    new DomainExceptionFilter().catch(new InvalidAppStoreUrlError("bad-url"), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.BAD_REQUEST }),
    );
  });

  it("maps AppNotFoundError to 404", () => {
    const { host, status } = mockHost();
    new DomainExceptionFilter().catch(new AppNotFoundError("123"), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
  });

  it("maps an unknown Error to 500 and logs it", () => {
    const errorSpy = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const { host, status, json } = mockHost();
    new DomainExceptionFilter().catch(new Error("kaboom"), host);
    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "kaboom",
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("maps a non-Error throwable to a generic 500 message", () => {
    vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const { host, json } = mockHost();
    new DomainExceptionFilter().catch("just a string", host);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
    });
  });
});
