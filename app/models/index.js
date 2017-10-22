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

const connection = require("./connection");
const Account = require("./account");
const Product = require("./product");
const Customer = require("./customer");
const Order = require("./order");
const OrderItem = require("./orderitem");

Customer.hasMany(Order, { as: "orders", onDelete: "CASCADE" });
Order.hasMany(OrderItem, { as: "items", onDelete: "CASCADE" });
OrderItem.belongsTo(Product, { as: "product" });
const sync = () => connection.sync();

module.exports = { sync, models: { Account, Product, Customer, Order, OrderItem } }
