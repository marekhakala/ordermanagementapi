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
const { Account, Customer, Order, OrderItem, Product } = require("./app/models/index").models;

const setupDB = () => {
  console.log("Setup database");
  console.log("[DB-setup] NODE_ENV=" + nodeEnv);

  return connection.sync({ force: true })
    .then(() => { console.log("[DB-setup] Start"); })
    .then(() => Account.truncate({ cascade: true }))
    .then(() => { console.log("[DB-setup] Accounts: Done"); })
    .then(() => Product.truncate({ cascade: true }))
    .then(() => { console.log("[DB-setup] Products: Done"); })
    .then(() => Customer.truncate({ cascade: true }))
    .then(() => { console.log("[DB-setup] Customers: Done"); })
    .then(() => Order.truncate({ cascade: true }))
    .then(() => { console.log("[DB-setup] Orders: Done"); })
    .then(() => OrderItem.truncate({ cascade: true }))
    .then(() => { console.log("[DB-setup] OrderItems: Done"); })
    .then(() => { console.log("[DB-setup] Done"); })
    .catch((exception) => {
      console.log("[ERROR]: " + exception);
    });
};

setupDB().then(() => connection.close());
