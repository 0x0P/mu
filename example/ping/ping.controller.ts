import {
  Controller,
  Method,
  OnConnect,
  OnDisconnect,
  OnError,
  Payload,
  Inject,
} from "@/index.ts";
import { PingService } from "./ping.service.ts";

@Controller()
export class PingController {
  constructor(@Inject(PingService) private readonly pingService: PingService) {}

  @OnConnect()
  onConnect(): void {
    console.log("onConnect: client connected");
  }

  @OnDisconnect()
  onDisconnect(): void {
    console.log("onDisconnect: client disconnected");
  }

  @OnError()
  onError(_ws: any, error: Error): void {
    console.error("onError:", error.message);
  }

  @Method("ping")
  handlePing(@Payload() payload: { name?: string } = {}): { data: string } {
    const data = this.pingService.ping(payload.name || "anon");
    return { data };
  }
}
