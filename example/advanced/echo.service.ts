import { Injectable } from "@/index.ts";

@Injectable()
export class EchoService {
  uppercase(text: string): string {
    return String(text ?? "").toUpperCase();
  }
}
