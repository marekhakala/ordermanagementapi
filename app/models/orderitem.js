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

const OrderItem = connection.define("orderitem", {
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  price: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  priceWithVat: {
    type: Sequelize.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  }
});

OrderItem.createOrderItem = (orderId, orderItem) => {
  const orderItemParams = {
    orderId: orderId,
    quantity: (typeof orderItem.quantity !== "undefined") ?  orderItem.quantity: 1,
    price: (typeof orderItem.price !== "undefined") ? orderItem.price : 0.0,
    priceWithVat: (typeof orderItem.priceWithVat !== "undefined") ? orderItem.priceWithVat : 0.0 };

    if(typeof orderItem.productCode !== "undefined") {
      return Product.findOne({ where: { code: orderItem.productCode }})
      .then(product => {
        if(product != null && product.id == null) {
          orderItemParams["productId"] = product.id;
        }

        return OrderItem.create(orderItemParams)
          .then(orderItem => {
            orderItem.product = product;
            return orderItem;
          });
      });
    } else {
      return OrderItem.create(orderItemParams);
    }
}

OrderItem.validateBeforeCreate = (orderItemParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(orderItemParams == null) {
    errorsHash.quantity = errorMessage;
    errorsHash.price = errorMessage;
    errorsHash.priceWithVat = errorMessage;
    errorsCount = 3;
  } else {
    if(typeof orderItemParams.quantity === "undefined") {
      errorsHash.quantity = errorMessage;
      errorsCount++;
    }
    if(typeof orderItemParams.price === "undefined") {
      errorsHash.price = errorMessage;
      errorsCount++;
    }
    if(typeof orderItemParams.priceWithVat === "undefined") {
      errorsHash.priceWithVat = errorMessage;
      errorsCount++;
    }
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

OrderItem.updateOrderItem = (orderItem, updateParams) => {
  let updateData = {};

  if(typeof updateParams.quantity !== "undefined") {
    updateData.quantity = updateParams.quantity;
  }
  if(typeof updateParams.price !== "undefined") {
    updateData.price = updateParams.price;
  }
  if(typeof updateParams.priceWithVat !== "undefined") {
    updateData.priceWithVat = updateParams.priceWithVat;
  }

  Object.assign(orderItem, updateData);
  return orderItem.save();
}

OrderItem.getItem = (orderId, orderItemId) => {
  return OrderItem.findOne({ where: { id: orderItemId, orderId: orderId } });
}

OrderItem.prototype.toJSON = function() {
  return { id: this.id, quantity: this.quantity,
    price: this.price, priceWithVat: this.priceWithVat,
    product: (this.product) ? this.product : null };
}

OrderItem.prototype.toJSONDetail = function() {
  return { id: this.id, quantity: this.quantity,
    price: this.price, priceWithVat: this.priceWithVat,
    product: (this.product) ? this.product : null,
    updatedAt: this.updatedAt, createdAt: this.createdAt };
}

module.exports = OrderItem;
