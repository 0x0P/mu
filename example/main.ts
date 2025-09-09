import "reflect-metadata";
import { createmuApp, Logger } from "../src/index.ts";
import { AppModule } from "./AppModule.ts";

await createmuApp(AppModule, {
  port: 3100,
  debug: true,
  logLevels: ["log", "error", "warn", "debug"],
  loggerOptions: {
    timestamp: "iso",
    colors: true,
    symbols: true,
    prettyObjects: true,
    contextStyle: "brackets",
  },
  globalInterceptors: [],
  globalGuards: [],
});

Logger.log("Advanced example bootstrapped", "bootstrap");
