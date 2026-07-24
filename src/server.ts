import { createAppServer } from "./server/http-server.js";
import { loadConfig } from "./shared/config.js";
import { createAppRuntime } from "./server/runtime.js";

const config = loadConfig();
const runtime = createAppRuntime(config);
const server = createAppServer({
  config,
  handleKakaoWebhook: runtime.handleKakaoWebhook
});

server.on("close", () => {
  void runtime.close();
});

server.listen(config.port, () => {
  console.log(`Travel AI Automation API listening on http://localhost:${config.port}`);
});
