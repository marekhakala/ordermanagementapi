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
const Sequelize = connection.Sequelize;

const Product = require("./product");
const OrderItem = require("./orderitem");

const Order = connection.define("order", {
  issuedAt: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn("NOW")
  }
});

Order.createOrder = (customerId, order) => {
  const orderItems = [];
  const orderParams = { customerId: customerId };
  const orderItemsParams = (typeof order.items !== "undefined") ? order.items : [];

  return Order.create(orderParams).then(order => {
    for(let orderItemParams of orderItemsParams) {
      orderItems.push(OrderItem.createOrderItem(order.id, orderItemParams));
    }
    orderItems.push(order.save());

    return Promise.all(orderItems).then(results => {
      let order = results[results.length-1];
      order.items = [];

      for(let i = 0; i < results.length-1; i++) {
        order.items.push(results[i]);
      }

      return order;
    });
  });
}

Order.validateBeforeCreate = (orderParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(orderParams == null) {
    errorsHash.items = errorMessage;
    errorsCount = 1;
  } else {
    if(typeof orderParams.items !== "undefined"
     && orderParams instanceof Array) {
      for(let itemParams of orderParams.items) {
          errors.items.push(OrderItem.validateBeforeCreate(itemParams));
      }
    }
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Order.validateBeforeUpdate = (orderParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(typeof orderParams.issuedAt !== "undefined"
  && orderParams.issuedAt.length < 1) {
    errorsHash.issuedAt = errorMessage;
    errorsCount++;
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Order.updateOrder = (order, updateParams) => {
  let updateData = {};

  if(typeof updateParams.issuedAt !== "undefined") {
    updateData.issuedAt = updateParams.issuedAt;
  }

  Object.assign(order, updateData);
  return order.save();
}

Order.getOrder = (customerId, orderId) => {
  return Order.findOne({ where: { id: orderId, customerId: customerId },
    include: [
      { model: OrderItem, as: "items",
      include: [{ model: Product, as: "product" }] }
    ],
    order: [["items", "createdAt", "DESC"]] });
}

Order.calcTotalPrice = (items) => {
  let totalPrice = 0;
  let totalPriceWithVat = 0;

  for(let item of items) {
    if(item != null) {
      totalPrice += item.price;
      totalPriceWithVat += item.priceWithVat;
    }
  }
  return { totalPrice: totalPrice.toFixed(2),
    totalPriceWithVat: totalPriceWithVat.toFixed(2) };
}

Order.prototype.toJSON = function() {
  let prices = Order.calcTotalPrice(this.items);
  return { id: this.id, totalPrice: prices.totalPrice,
    totalPriceWithVat: prices.totalPriceWithVat,
    issuedAt: this.issuedAt, updatedAt: this.updatedAt,
    createdAt: this.createdAt };
}

Order.prototype.toJSONDetail = function() {
  let prices = Order.calcTotalPrice(this.items);
  return { id: this.id, items: this.items, totalPrice: prices.totalPrice,
    totalPriceWithVat: prices.totalPriceWithVat,
    issuedAt: this.issuedAt, updatedAt: this.updatedAt,
    createdAt: this.createdAt };
}

module.exports = Order;
