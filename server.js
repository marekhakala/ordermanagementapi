/*
  Copyright 2017 <hakala.marek@gmail.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import fs from "fs";
import http from "http";
import path from "path";
import methods from "methods";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cors from "cors";
import errorhandler from "errorhandler";

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const isDevelopment = nodeEnv === "development";
const appConfig = require("./config/env.json")[nodeEnv];

const app = express();
app.use(cors());
app.use(require("morgan")("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(require("method-override")());
app.use(session({ secret: "ordermanagementapi", cookie: { maxAge: 60000 },
 resave: false, saveUninitialized: false }));
if(!isProduction) { app.use(errorhandler()); }

/// Error 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ status: 404,
    message: "Not found", statusMessage: "error",
    errors: { content: "Not found" } });
  next();
});

// Development Error Handler
if (!isProduction) {
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(500).json({ status: 500,
      message: "Internal error", statusMessage: "error",
      errors: { api: "Internal error" } });
  });
}

// Production Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({ status: 500,
    message: "Internal error", statusMessage: "error",
    errors: { api: "Internal error" } });
});

// Start server
const server = app.listen(process.env.PORT || appConfig["PORT"], () => {
  console.log("Starting server ... ;)");
  console.log("NODE_ENV=" + nodeEnv);
  console.log("Listening on port " + server.address().port);
});

module.exports = server;
