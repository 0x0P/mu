import { Injectable, type Interceptor } from "@/index.ts";

@Injectable()
export class TimingInterceptor implements Interceptor {
  async intercept(_context: any, _message: any, next: () => Promise<any>) {
    const t0 = performance.now?.() ?? Date.now();
    const result = await next();
    const t1 = performance.now?.() ?? Date.now();
    const elapsedMs = Math.round((t1 - t0) * 1000) / 1000;
    return { data: result, meta: { elapsedMs } };
  }
}
