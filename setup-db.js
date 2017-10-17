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
const connection = require("./app/models/connection");

const setupDB = () => {
  console.log("Setup database");
  console.log("[DB-setup] NODE_ENV=" + nodeEnv);

  return connection.sync({ force: true })
    .then(() => { console.log("[DB-setup] Start"); })
    .then(() => { console.log("[DB-setup] Done"); })
    .catch((exception) => {
      console.log("[ERROR]: " + exception);
    });
};

setupDB().then(() => connection.close());
