import {
  Controller,
  Method,
  Payload,
  Message,
  Headers,
  Query,
  Ip,
  Handshake,
  Socket,
  Context,
  Inject,
  UseInterceptors,
  UseGuards,
} from "@/index.ts";
import { EchoService } from "./echo.service.ts";
import { LoggingInterceptor } from "./logging.interceptor.ts";
import { TimingInterceptor } from "./timing.interceptor.ts";
import { HeaderGuard } from "./header.guard.ts";
import { CONFIG, type Config, BANNER } from "../tokens.ts";

@UseInterceptors(LoggingInterceptor)
@Controller("echo")
export class EchoController {
  constructor(
    @Inject(EchoService) private readonly echo: EchoService,
    @Inject(CONFIG) private readonly cfg: Config,
    @Inject(BANNER) private readonly banner: string
  ) {}

  @UseInterceptors(TimingInterceptor)
  @Method("upper")
  upper(@Payload() payload: { text?: string }) {
    const text = payload?.text ?? this.cfg.greeting;
    return { data: this.echo.uppercase(text) };
  }

  @UseGuards(HeaderGuard)
  @Method("push")
  push(@Socket() ws: any, @Message() msg: any) {
    const echo = { type: "echo.push", id: msg?.id, data: msg?.payload };
    try {
      ws.send(JSON.stringify(echo));
    } catch {}
    return { success: true };
  }

  @Method("info")
  info(
    @Headers() headers: Record<string, string>,
    @Query() query: Record<string, string | string[]>,
    @Ip() ip?: string,
    @Handshake() handshake?: any,
    @Context() ctx?: any
  ) {
    return {
      data: {
        headers,
        query,
        ip: ip ?? null,
        connectionId: ctx?.connectionId,
        url: handshake?.url,
        banner: this.banner,
      },
    };
  }
}
