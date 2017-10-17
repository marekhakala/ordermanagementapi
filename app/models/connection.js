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

const nodeEnv = process.env.NODE_ENV || "development";
const appConfig = require("./../../config/env.json")[nodeEnv];
const Sequelize = require("sequelize");

const connection = new Sequelize({ protocol: appConfig["DB_PROTOCOL"],
  host: appConfig["DB_HOST"], port: appConfig["DB_PORT"],
  username: appConfig["DB_USERNAME"], password: appConfig["DB_PASSWORD"],
  dialect: appConfig["DB_DIALECT"], database: appConfig["DB_NAME"],
  logging: false, operatorsAliases: false });

module.exports = connection;
