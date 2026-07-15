import { createAppServer } from "./server/http-server.js";

import { loadConfig } from "./shared/config.js";

const port = loadConfig().port;
const server = createAppServer();

server.listen(port, () => {
  console.log(`Travel AI Automation API listening on http://localhost:${port}`);
});
