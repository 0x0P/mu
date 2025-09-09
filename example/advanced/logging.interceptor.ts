import { Injectable, type Interceptor, Logger } from "@/index.ts";

@Injectable()
export class LoggingInterceptor implements Interceptor {
  private readonly logger = new Logger("LoggingInterceptor");
  async intercept(context: any, message: any, next: () => Promise<any>) {
    const start = Date.now();
    this.logger.debug({ event: message?.type, phase: "before" });
    try {
      const result = await next();
      const ms = Date.now() - start;
      this.logger.debug({ event: message?.type, phase: "after", ms });
      return result;
    } catch (e) {
      const ms = Date.now() - start;
      this.logger.error("intercept error", e as any);
      this.logger.debug({ event: message?.type, phase: "error", ms });
      throw e;
    }
  }
}
