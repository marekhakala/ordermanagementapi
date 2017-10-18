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

import crypto from "crypto";
import jwt from "express-jwt";
const blacklist = require("./../config/jwtblacklist");
import { secret as secret } from "../config";

function getTokenFromHeader(req) {
  if (req.headers.authorization
    && req.headers.authorization.split(" ")[0] === "Token") {
    return req.headers.authorization.split(" ")[1];
  }
  return null;
}

const auth = {
  required: jwt({ secret: secret, userProperty: "payload",
    isRevoked: blacklist.isRevoked, getToken: getTokenFromHeader }),
  optional: jwt({ secret: secret, userProperty: "payload", credentialsRequired: false,
    isRevoked: blacklist.isRevoked, getToken: getTokenFromHeader })
};

module.exports = auth;
