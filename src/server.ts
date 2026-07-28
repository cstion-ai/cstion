import type { Server } from "node:http";
import { pathToFileURL } from "node:url";
import { createAppServer } from "./server/http-server.js";
import { createAppRuntime } from "./server/runtime.js";
import { loadConfig, type PlatformConfig } from "./shared/config.js";

export async function startServer(config: PlatformConfig = loadConfig()): Promise<Server> {
  const runtime = createAppRuntime(config);
  const server = createAppServer({
    config,
    handleKakaoWebhook: runtime.handleKakaoWebhook
  });

  server.on("close", () => {
    void runtime.close();
  });

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(config.port, config.host, () => {
        server.removeListener("error", reject);
        resolve();
      });
    });
  } catch (error: unknown) {
    await runtime.close();
    throw error;
  }

  const address = server.address();
  const listeningPort =
    address && typeof address !== "string" ? address.port : config.port;
  console.log(`Travel AI Automation API listening on http://${config.host}:${listeningPort}`);
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await startServer();
}
