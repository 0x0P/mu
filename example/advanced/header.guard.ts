import { Injectable, type Guard, Logger } from "@/index.ts";

@Injectable()
export class HeaderGuard implements Guard {
  private readonly logger = new Logger("HeaderGuard");
  async canActivate(context: any): Promise<boolean> {
    const headers = context?.handshake?.headers || {};
    const ok = headers["x-mu-demo"] === "ok";
    if (!ok) this.logger.warn("blocked by HeaderGuard");
    return ok;
  }
}
