import { Module } from "@/index.ts";
import { PingController } from "./ping/ping.controller.ts";
import { PingService } from "./ping/ping.service.ts";
import { CatsController } from "./cat/cats.controller.ts";
import { CatsService } from "./cat/cats.service.ts";
import { AdvancedModule } from "./advanced/advanced.module.ts";

@Module({
  imports: [AdvancedModule],
  controllers: [PingController, CatsController],
  providers: [PingService, CatsService],
})
export class AppModule {}
