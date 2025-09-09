import { Injectable } from "@/index.ts";

@Injectable()
export class PingService {
  ping(name: string): string {
    return `pong:${name || "anon"}`;
  }
}
