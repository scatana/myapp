import { app as serverEn } from "./en/server.mjs";
import { app as serverFr } from "./fr/server.mjs";
import { app as serverRo } from "./ro/server.mjs";

const express = require("express");

function run() {
  const port = process.env.PORT || 4000;
  const server = express();

  server.use("/en", serverEn());
  server.use("/fr", serverFr());
  server.use("/ro", serverRo());
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
