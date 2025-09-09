import { Injectable } from "@/index.ts";

@Injectable()
export class MathService {
  add(a: number, b: number): number {
    return Number(a) + Number(b);
  }
  mul(a: number, b: number): number {
    return Number(a) * Number(b);
  }
}
