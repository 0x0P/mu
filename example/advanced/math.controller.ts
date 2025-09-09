import {
  Controller,
  Method,
  Payload,
  Inject,
  UseInterceptors,
} from "@/index.ts";
import { MathService } from "./math.service.ts";
import { TimingInterceptor } from "./timing.interceptor.ts";

@Controller("math")
export class MathController {
  constructor(@Inject(MathService) private readonly math: MathService) {}

  @UseInterceptors(TimingInterceptor)
  @Method("add")
  add(@Payload() p: { a?: number; b?: number }) {
    const a = Number(p?.a ?? 0);
    const b = Number(p?.b ?? 0);
    return { data: this.math.add(a, b) };
  }

  @Method("mul")
  mul(@Payload() p: { a?: number; b?: number }) {
    const a = Number(p?.a ?? 1);
    const b = Number(p?.b ?? 1);
    return { data: this.math.mul(a, b) };
  }
}
