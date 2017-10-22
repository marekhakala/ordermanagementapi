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

const nodeEnv = process.env.NODE_ENV || "development";
const appConfig = require("./../../config/env.json")[nodeEnv];

const Order = require("./order");
const OrderItem = require("./orderitem");

const Customer = connection.define("customer", {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: "The first name is required." }}
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: "The last name is required." }}
  },
  phone: {
    type: Sequelize.STRING,
    allowNull: true
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      isEmail: { msg: "The e-mail address is invalid." },
      notEmpty: { msg: "The e-mail address is required." }
    }
  },
  photo: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: ""
  }
});

Customer.seedCustomer = (customer) => {
  const customerParams = {
    firstName: (typeof customer.firstName !== "undefined") ? customer.firstName : "",
    lastName: (typeof customer.lastName !== "undefined") ? customer.lastName : "",
    phone: (typeof customer.phone !== "undefined") ? customer.phone : "",
    email: (typeof customer.email !== "undefined") ? customer.email : "",
    photo: (typeof customer.photoSeed !== "undefined") ? customer.photoSeed : "" };
  return Customer.createCustomer(customerParams);
}

Customer.createCustomer = (customer) => {
  const customerParams = {
    firstName: (typeof customer.firstName !== "undefined") ? customer.firstName : "",
    lastName: (typeof customer.lastName !== "undefined") ? customer.lastName : "",
    phone: (typeof customer.phone !== "undefined") ? customer.phone : "",
    email: (typeof customer.email !== "undefined") ? customer.email : "",
    photo: (typeof customer.photo !== "undefined") ? customer.photo : "" };

  const customerOrders = [];
  const ordersParams = (typeof customer.orders !== "undefined") ? customer.orders : [];

  return Customer.create(customerParams).then(customer => {
    for(let orderParams of ordersParams) {
      customerOrders.push(Order.createOrder(customer.id, orderParams));
    }

    customerOrders.push(customer.save());
    return Promise.all(customerOrders).then(results => results[results.length-1]);
  });
}

Customer.validateBeforeCreate = (customerParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(customerParams == null) {
    errorsHash.firstName = errorMessage;
    errorsHash.lastName = errorMessage;
    errorsHash.email = errorMessage;
    errorsCount = 3;
  } else {
    if(typeof customerParams.firstName === "undefined"
    || customerParams.firstName.length < 1) {
      errorsHash.firstName = errorMessage;
      errorsCount++;
    }
    if(typeof customerParams.lastName === "undefined"
    || customerParams.lastName.length < 1) {
      errorsHash.lastName = errorMessage;
      errorsCount++;
    }
    if(typeof customerParams.email === "undefined"
    || customerParams.email.length < 1) {
      errorsHash.email = errorMessage;
      errorsCount++;
    }
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Customer.validateBeforeUpdate = (customerParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(typeof customerParams.firstName !== "undefined"
  && customerParams.firstName.length < 1) {
    errorsHash.firstName = errorMessage;
    errorsCount++;
  }
  if(typeof customerParams.lastName !== "undefined"
  && customerParams.lastName.length < 1) {
    errorsHash.lastName = errorMessage;
    errorsCount++;
  }
  if(typeof customerParams.email !== "undefined"
  && customerParams.email.length < 1) {
    errorsHash.email = errorMessage;
    errorsCount++;
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Customer.updateCustomer = (customer, updateParams) => {
  let updateData = {};

  if(typeof updateParams.firstName !== "undefined") {
    updateData.firstName = updateParams.firstName;
  }
  if(typeof updateParams.lastName !== "undefined") {
    updateData.lastName = updateParams.lastName;
  }
  if(typeof updateParams.phone !== "undefined") {
    updateData.phone = updateParams.phone;
  }
  if(typeof updateParams.email !== "undefined") {
    updateData.email = updateParams.email;
  }

  Object.assign(customer, updateData);
  return customer.save();
}

Customer.getCustomer = (id) => {
  return Customer.findById(id, { include: [
    { model: Order, as: "orders",
     include: [{ model: OrderItem, as: "items" }]} ],
    order: [["orders", "createdAt", "DESC"], ["createdAt", "DESC"]] });
}

Customer.allCustomers = () => {
  return Customer.getCustomers({});
}

Customer.searchCustomers = (expression) => {
  return Customer.getCustomers({
    [Sequelize.Op.or]: [
      { firstName: { [Sequelize.Op.iLike]: "%" + expression + "%" } },
      { lastName: { [Sequelize.Op.iLike]: "%" + expression + "%" } } ]
  });
}

Customer.getCustomers = (whereClause) => {
  return Customer.findAll({ where: whereClause, include: [ { model: Order, as: "orders" } ],
   order: [["orders", "createdAt", "DESC"], ["createdAt", "DESC"]] });
}

Customer.getBaseLocalPhotoPath = () => {
  return appConfig["photosPath"]["base"]
  + appConfig["photosPath"]["customers"];
}

Customer.prototype.getFullname = function() {
  return this.firstName + " " + this.lastName;
}

Customer.prototype.getLocalPhotoPath = function() {
  return appConfig["photosPath"]["base"]
  + appConfig["photosPath"]["customers"] + this.photo;
}

Customer.prototype.toJSON = function() {
  return { id: this.id, firstName: this.firstName, lastName: this.lastName,
    phone: this.phone, email: this.email, photo: this.photo,
    updatedAt: this.updatedAt, createdAt: this.createdAt };
}

Customer.prototype.toJSONDetail = function() {
  return { id: this.id, firstName: this.firstName, lastName: this.lastName,
    phone: this.phone, email: this.email, photo: this.photo, orders: this.orders,
    ordersCount: (this.orders != null) ? this.orders.length : 0,
    updatedAt: this.updatedAt, createdAt: this.createdAt };
}

module.exports = Customer;
