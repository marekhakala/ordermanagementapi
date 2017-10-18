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

import redis from "redis";
import jwt from "express-jwt";
import blacklist from "express-jwt-blacklist";

const nodeEnv = process.env.NODE_ENV || "development";
const appConfig = require("./../../config/env.json")[nodeEnv];
const client = redis.createClient(appConfig["REDIS_PORT"], appConfig["REDIS_HOST"]);

blacklist.configure({
    tokenId: "jti", strick: true,
    store: {
      type: "redis", client,
      keyPrefix: "ordermanagementapi:",
      options: { timeout: 1000 }
    }
});

module.exports = blacklist;
