import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";

interface HealthStatus {
  status: "ok";
  uptime: number;
  timestamp: string;
}

@SkipThrottle()
@Controller()
export class HealthController {
  @Get("healthz")
  check(): HealthStatus {
    return {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
