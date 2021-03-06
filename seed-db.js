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

const fs = require("fs-extra");
const nodeEnv = process.env.NODE_ENV || "development";
const appConfig = require("./config/env.json")[nodeEnv];
const connection = require("./app/models/connection");
const { Account, Customer, Order, OrderItem, Product } = require("./app/models/index").models;

const seedPhotos = "./seed/photos/";
const seedPhotoProducts = seedPhotos + "products/";
const seedPhotoCustomers = seedPhotos + "customers/";

const accounts = require("./seed/accounts.json");
const products = require("./seed/products.json");
const customers = require("./seed/customers_and_orders.json");

const consoleOutput = (text, verbose) => {
  if(verbose) { console.log(text); }
};

const seed = (verbose = false) => {
  console.log("Seed file");
  console.log("[DB-seed] NODE_ENV=" + nodeEnv);

  return connection.sync({ force: true })
    .then(() => fs.emptyDir(appConfig["photosPath"]["base"]))
    .then(() => { consoleOutput("[DB-seed] Start", verbose); })
    .then(() => { consoleOutput("[DB-seed] Accounts : Start", verbose); })
    .then(() => Account.truncate({ cascade: true }))
    .then(() => Promise.all(accounts.map(account => Account.createAccount(account))))
    .then(() => { consoleOutput("[DB-seed] Accounts : Done", verbose); })
    .then(() => { consoleOutput("[DB-seed] Products : Start", verbose); })
    .then(() => Product.truncate({ cascade: true }))
    .then(() => {
      let promises = [];
      for(let product of products) {
        let source = seedPhotoProducts + product.photo;
        let destination = appConfig["photosPath"]["base"] + appConfig["photosPath"]["products"] + product.photoSeed;
        promises.push(fs.copy(seedPhotoProducts + product.photo,
          appConfig["photosPath"]["base"] +
          appConfig["photosPath"]["products"] + product.photoSeed));
        promises.push(Product.seedProduct(product));

        consoleOutput("[DB-seed] Products : " + product.name
          + ", $" + product.price + " (" + product.priceWithVat + ")", verbose);
      }
      return Promise.all(promises);
    })
    .then(() => { consoleOutput("[DB-seed] Products : Done", verbose); })
    .then(() => { consoleOutput("[DB-seed] Customers, Orders, and OrderItems : Start", verbose); })
    .then(() => Customer.truncate({ cascade: true }))
    .then(() => {
      let promises = [];
      for(let customer of customers) {
        promises.push(fs.copy(seedPhotoCustomers + customer.photo,
          appConfig["photosPath"]["base"] +
          appConfig["photosPath"]["customers"] + customer.photoSeed));
        promises.push(Customer.seedCustomer(customer));

        consoleOutput("[DB-seed] Customers : " + customer.firstName + " "
          + customer.lastName + " (" + customer.email + ")", verbose);
      }
      return Promise.all(promises);
    })
    .then(() => { consoleOutput("[DB-seed] Customers, Orders, and OrderItems : Done", verbose); })
    .then(() => { consoleOutput("[DB-seed] Done", verbose); })
    .catch((exception) => {
      console.log("[ERROR]: " + exception);
    });
};

module.exports = seed;
