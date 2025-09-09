import { Injectable } from "@/index.ts";

@Injectable()
export class ConnectionScopedService {
  private readonly createdAt = Date.now();
  getCreatedAt(): number {
    return this.createdAt;
  }
}
