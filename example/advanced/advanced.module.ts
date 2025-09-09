import { Module } from "@/index.ts";
import { EchoController } from "./echo.controller.ts";
import { MathController } from "./math.controller.ts";
import { RoomController } from "./room.controller.ts";
import { EchoService } from "./echo.service.ts";
import { MathService } from "./math.service.ts";
import { LoggingInterceptor } from "./logging.interceptor.ts";
import { TimingInterceptor } from "./timing.interceptor.ts";
import { HeaderGuard } from "./header.guard.ts";
import { ConnectionScopedService } from "./scoped.service.ts";
import { CONFIG, type Config } from "../tokens.ts";
import { BANNER } from "../tokens.ts";

@Module({
  controllers: [EchoController, MathController, RoomController],
  providers: [
    EchoService,
    MathService,
    // connection-scoped interceptor & service
    {
      provide: LoggingInterceptor,
      useClass: LoggingInterceptor,
      scope: "connection",
    },
    {
      provide: TimingInterceptor,
      useClass: TimingInterceptor,
      scope: "connection",
    },
    HeaderGuard,
    {
      provide: ConnectionScopedService,
      useClass: ConnectionScopedService,
      scope: "connection",
    },
    // value & factory token providers
    { provide: CONFIG, useValue: { greeting: "hello, mu" } as Config },
    {
      provide: BANNER,
      useFactory: (cfg: Config) => `${cfg.greeting} - advanced demo`,
      inject: [CONFIG],
    },
  ],
})
export class AdvancedModule {}
