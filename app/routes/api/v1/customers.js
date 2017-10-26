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

import passport from "passport";
const router = require("express").Router();
const { Account, Customer, Order, OrderItem } = require("./../../../models/index").models;

const mime = require("mime-types");
const multer = require("multer");
const { OnFileFilter, OnFilename } = require("./../../../config/multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, Customer.getBaseLocalPhotoPath());
  }, filename: OnFilename });
const upload = multer({ fileFilter: OnFileFilter, storage: storage });
const customerUpload = upload.single("photo");

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

import auth from "../../auth";

/**
 * @swagger
 * definitions:
 *  OrderItem:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Order item id
 *      quantity:
 *        type: integer
 *        description: Order item quantity
 *      price:
 *        type: string
 *        description: Order item price
 *      priceWithVat:
 *        type: string
 *        description: Order item price with VAT
 *      product:
 *        type: object
 *        description: Order item product
 *        $ref: "#/definitions/Product"
 *  OrderDetail:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Order id
 *      items:
 *        type: array
 *        description: Order items
 *        items:
 *          $ref: "#/definitions/OrderItem"
 *      totalPrice:
 *        type: string
 *        description: Order total price
 *      totalPriceWithVat:
 *        type: string
 *        description: Order total price with VAT
 *      issuedAt:
 *        type: string
 *        format: date-time
 *      updatedAt:
 *        type: string
 *        format: date-time
 *        description: Order update timestamp
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: Order create timestamp
 *  Order:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Order id
 *      totalPrice:
 *        type: string
 *        description: Order total price
 *      totalPriceWithVat:
 *        type: string
 *        description: Order total price with VAT
 *      issuedAt:
 *        type: string
 *        format: date-time
 *      updatedAt:
 *        type: string
 *        format: date-time
 *        description: Order update timestamp
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: Order create timestamp
 *  OrderList:
 *    type: object
 *    properties:
 *      status:
 *        type: integer
 *        description: HTTP status code
 *      message:
 *        type: string
 *        description: Content description
 *      statusMessage:
 *        type: string
 *        description: HTTP status text
 *      orders:
 *        type: array
 *        items:
 *          $ref: "#/definitions/Order"
 *      count:
 *        type: integer
 *        description: The number of orders
 *  Customer:
 *    type: object
 *    properties:
 *      firstName:
 *        type: integer
 *        description: Customer first name
 *      lastName:
 *        type: string
 *        description: Customer last name
 *      phone:
 *        type: string
 *        description: Customer phone number
 *      email:
 *        type: string
 *        description: Customer email address
 *      photo:
 *        type: number
 *        format: float
 *        description: Customer photo
 *      updatedAt:
 *        type: string
 *        format: date-time
 *        description: Customer update timestamp
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: Customer create timestamp
 *  CustomerList:
 *    type: object
 *    properties:
 *      status:
 *        type: integer
 *        description: HTTP status code
 *      message:
 *        type: string
 *        description: Content description
 *      statusMessage:
 *        type: string
 *        description: HTTP status text
 *      customers:
 *        type: array
 *        items:
 *          $ref: "#/definitions/Customer"
 *      count:
 *        type: integer
 *        description: The number of customers
 *  ErrorMessage:
 *    type: object
 *    properties:
 *      status:
 *        type: integer
 *        description: HTTP status code
 *      message:
 *        type: string
 *        description: Content description
 *      statusMessage:
 *        type: string
 *        description: HTTP status text
 *      errors:
 *        $ref: "#/definitions/ErrorMessages"
 *  ErrorMessages:
 *    additionalProperties:
 *      type: string
 */

router.param("customerId", (req, res, next, id) => {
  req.customerId = (id) ? id : null;

  Customer.getCustomer(id).then(customer => {
    req.customer = (customer) ? customer : null;
    return next();
  });
});

router.param("orderId", (req, res, next, id) => {
  req.orderId = (id) ? id : null;

  Order.getOrder(req.customerId, req.orderId).then(order => {
    req.order = (order) ? order : null;
    return next();
  });
});

router.param("orderItemId", (req, res, next, id) => {
  req.orderItemId = (id) ? id : null;
  return next();
});

/**
 * @swagger
 * /v1/customers:
 *  get:
 *    tags:
 *      - Customers
 *    description: Get customers
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: search
 *        description: The filter expression for search by a customer name or subset of the customer name.
 *        in: url
 *        type: string
 *    responses:
 *      200:
 *        description: Customer response
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            account:
 *              type: object
 *              $ref: "#/definitions/AccountAuth"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    let customersQuery;
    if(typeof req.query.search !== "undefined") {
      customersQuery = Customer.searchCustomers(req.query.search);
    } else {
      customersQuery = Customer.allCustomers();
    }

    return customersQuery.then(customers => res.status(200).json({ status: 200,
       message: "Customer list", statusMessage: "ok",
       customers: customers.map(customer => customer.toJSON()),
       count: customers.length }));
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers:
 *  post:
 *    tags:
 *      - Customers
 *    description: Add a new customer
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: customer[firstName]
 *        description: Customer first name
 *        in: body
 *        type: string
 *        required: true
 *      - name: customer[lastName]
 *        description: Customer last name
 *        in: body
 *        type: string
 *        required: true
 *      - name: customer[phone]
 *        description: Customer phone number
 *        in: body
 *        type: string
 *      - name: customer[email]
 *        description: Customer E-mail address
 *        in: body
 *        type: number
 *        format: float
 *        required: true
 *    responses:
 *      201:
 *        description: The customer result
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            product:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.post("/", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    const validationResult = Customer.validateBeforeCreate(req.body.customer);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable customer entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Customer.createCustomer(req.body.customer)
    .then(customer => res.status(201).json({ status: 201,
      message: "Customer created", statusMessage: "created",
      customer: customer.toJSONDetail() }))
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId:
 *  get:
 *    tags:
 *      - Customers
 *    description: Get a customer
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The customer result
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            customer:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/:customerId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    return res.status(200).json({ status: 200, message: "Get",
      statusMessage: "ok", customer: req.customer.toJSONDetail() });
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId:
 *  put:
 *    tags:
 *      - Customers
 *    description: Update a customer
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: customer[firstName]
 *        description: Customer first name
 *        in: body
 *        type: string
 *      - name: customer[lastName]
 *        description: Customer last name
 *        in: body
 *        type: string
 *      - name: customer[phone]
 *        description: Customer phone number
 *        in: body
 *        type: string
 *      - name: customer[email]
 *        description: Customer email address
 *        in: body
 *        type: string
 *    responses:
 *      201:
 *        description: Customer
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            customer:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.put("/:customerId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    const validationResult = Customer.validateBeforeUpdate(req.body.customer);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable customer entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Customer.updateCustomer(req.customer, req.body.customer)
    .then(customer => res.status(201).json({ status: 201,
       message: "Customer updated", statusMessage: "updated",
       customer: customer.toJSONDetail() }));
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId:
 *  delete:
 *    tags:
 *      - Customers
 *    description: Delete a customer
 *    produces:
 *      - application/json
 *    security:
 *      - Jwt: []
 *    responses:
 *      204:
 *        description: Deleted
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.delete("/:customerId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    return req.customer.destroy()
    .then(() => res.sendStatus(204));
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId/photo:
 *  get:
 *    tags:
 *      - Customers
 *    description: Get a customer photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      201:
 *        description: Customer
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            customer:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      404:
 *        description: Not found
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/:customerId/photo", auth.required, (req, res, next) => {
   Account.validateAccount(req.payload).then(account => {
     if(account == null) {
       return res.status(401).json({ status: 401,
         message: "Unauthorized", statusMessage: "error",
         errors: { token: "Invalid" } });
     }

     if(req.customer == null
       || req.customer.photo == null || req.customer.photo == ""
       || !fs.existsSync(path.resolve(req.customer.getLocalPhotoPath()))) {
       return res.status(404).json({ status: 404,
         message: "Not found", statusMessage: "error",
         errors: { product: "Not found" } });
     }

     return res.sendFile(path.resolve(req.customer.getLocalPhotoPath()));
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId/photo:
 *  post:
 *    tags:
 *      - Customers
 *    description: Add or update a customer photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: photo
 *        description: Customer photo
 *        in: body
 *        type: string
 *        format: binary
 *    responses:
 *      201:
 *        description: Customer
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            customer:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.post("/:customerId/photo", auth.required, (req, res, next) => {
  customerUpload(req, res, (err) => {
    Account.validateAccount(req.payload).then(account => {
      if(account == null) {
        return res.status(401).json({ status: 401,
          message: "Unauthorized", statusMessage: "error",
          errors: { token: "Invalid" } });
      }

      if(req.customer == null) {
        return res.status(404).json({ status: 404,
          message: "Not found", statusMessage: "error",
          errors: { customer: "Not found" } });
      }

      if(err || !req.file) {
        return res.status(422).json({ status: 422,
          message: "Unprocessable product entity",
          statusMessage: "error",
          errors: { photo: "Invalid photo image format" } });
      }

      if(req.file == null) {
        return res.status(422).json({ status: 422,
          message: "Unprocessable product entity",
          statusMessage: "error",
          errors: { photo: "Data corrupted" } });
      }

      if(req.customer.photo != ""
      && fs.existsSync(req.customer.getLocalPhotoPath())) {
        fse.removeSync(req.customer.getLocalPhotoPath());
      }

      req.customer.photo = req.file.filename;
      return req.customer.save().then(customer => res.status(201).json({
        status: 201, message: "Customer updated",
        statusMessage: "updated", customer: customer.toJSON() }));
   }).catch(next);
  });
});

/**
 * @swagger
 * /v1/customers/:customerId/photo:
 *  delete:
 *    tags:
 *      - Customers
 *    description: Remove a customer photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: Customer
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            customer:
 *              type: object
 *              $ref: "#/definitions/Customer"
 *              description: Customer item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.delete("/:customerId/photo", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null || req.customer.photo === null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    if(fs.existsSync(req.customer.getLocalPhotoPath())) {
      fse.removeSync(req.customer.getLocalPhotoPath());
    }

    req.customer.photo = "";
    return req.customer.save().then(customer => res.status(200).json({
      status: 200, message: "Customer updated",
      statusMessage: "updated", customer: customer.toJSON() }));
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders:
 *  get:
 *    tags:
 *      - Orders
 *    description: Get customer orders
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: search
 *        description: The filter expression for search by an order price.
 *        in: url
 *        type: string
 *      - name: searchMethod
 *        description: Search method - gt (greater than), lt (less than), gte (greater than equal), lte (less than equal), or eq (equal to)
 *        in: url
 *        type: string
 *    responses:
 *      200:
 *        description: List of customer orders
 *        schema:
 *          type: object
 *          $ref: "#/definitions/OrderList"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/:customerId/orders", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null
      || typeof req.customer.orders === "undefined") {
        return res.status(404).json({ status: 404,
          message: "Not found", statusMessage: "error",
          errors: { customer: "Not found" } });
    }

    let ordersResult = req.customer.orders.map(order => order.toJSON());
    if(req.body.search != null) {
      if(req.body.searchMethod != null
      && req.body.searchMethod == "gt") {
        ordersResult = ordersResult
        .filter(order => order.totalPrice > req.body.search);
      } else if(req.body.searchMethod != null
      && req.body.searchMethod == "gte") {
        ordersResult = ordersResult
        .filter(order => order.totalPrice >= req.body.search);
      } else if(req.body.searchMethod != null
      && req.body.searchMethod == "lt") {
        ordersResult = ordersResult
        .filter(order => order.totalPrice < req.body.search);
      } else if(req.body.searchMethod != null
      && req.body.searchMethod == "lte") {
        ordersResult = ordersResult
        .filter(order => order.totalPrice <= req.body.search);
      } else {
        ordersResult = ordersResult
        .filter(order => order.totalPrice == req.body.search);
      }
    }

    return res.status(200).json({ status: 200,
      message: "Customer Orders", statusMessage: "ok",
      orders: ordersResult, count: ordersResult.length });
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders:
 *  post:
 *    tags:
 *      - Orders
 *    description: Add a new order
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: order[issuedAt]
 *        in: body
 *        type: string
 *      - name: order[items]
 *        description: List of order items
 *        in: body
 *        type: array
 *        items:
 *          $ref: "#/definitions/OrderItem"
 *    responses:
 *      201:
 *        description: The order result
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            order:
 *              type: object
 *              $ref: "#/definitions/OrderDetail"
 *              description: Order item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.post("/:customerId/orders", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null
      || typeof req.customerId === "undefined") {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    const validationResult = Order.validateBeforeCreate(req.body.order);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable order entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Order.createOrder(req.customerId, req.body.order)
    .then(order => { res.status(201).json({ status: 201,
      message: "Customer order created", statusMessage: "created",
      order: order.toJSONDetail() })
    });
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders/:orderId:
 *  get:
 *    tags:
 *      - Orders
 *    description: Get a order
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The order result
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            order:
 *              type: object
 *              $ref: "#/definitions/OrderDetail"
 *              description: Order item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/:customerId/orders/:orderId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null || req.order == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    return res.status(200).json({ status: 200, message: "Get",
      statusMessage: "ok", order: req.order.toJSONDetail() });
  }).catch(next);
});

/**
 * @swagger
 * /v1/customers/:customerId/orders/:orderId:
 *  put:
 *    tags:
 *      - Orders
 *    description: Update an order
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: customer[issuedAt]
 *        in: body
 *        type: string
 *        format: date-time
 *    responses:
 *      201:
 *        description: Product
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            order:
 *              type: object
 *              $ref: "#/definitions/OrderDetail"
 *              description: Order item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.put("/:customerId/orders/:orderId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null || typeof req.order == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    const validationResult = Order.validateBeforeUpdate(req.body.order);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable order entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Order.updateOrder(req.order, req.body.order)
    .then(order => res.status(201).json({ status: 201,
       message: "Customer order updated", statusMessage: "updated",
       order: order.toJSONDetail() }));
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders/:orderId:
 *  delete:
 *    tags:
 *      - Orders
 *    description: Delete an order
 *    produces:
 *      - application/json
 *    security:
 *      - Jwt: []
 *    responses:
 *      204:
 *        description: Deleted
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.delete("/:customerId/orders/:orderId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null || req.order == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    return req.order.destroy()
    .then(() => res.sendStatus(204)).catch(next);
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders/orderId/items:
 *  post:
 *    tags:
 *      - Orders
 *    description: Add an order item
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: order[quantity]
 *        description: Order item quantity
 *        in: body
 *        type: number
 *        format: integer
 *        required: true
 *      - name: order[price]
 *        description: Order item price
 *        in: body
 *        type: number
 *        format: float
 *        required: true
 *      - name: order[priceWithVat]
 *        description: Order item price with VAT
 *        in: body
 *        type: number
 *        format: float
 *        required: true
 *    responses:
 *      201:
 *        description: Order item
 *        schema:
 *          type: object
 *          properties:
 *            status:
 *              type: integer
 *              description: HTTP status code
 *            message:
 *              type: string
 *              description: Content description
 *            statusMessage:
 *              type: string
 *              description: HTTP status text
 *            orderItem:
 *              type: object
 *              $ref: "#/definitions/Product"
 *              description: Order item
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.post("/:customerId/orders/:orderId/items", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.customer == null || req.order == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { customer: "Not found" } });
    }

    const validationResult = OrderItem.validateBeforeCreate(req.body.item);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable order item entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return OrderItem.createOrderItem(req.order.id, req.body.item)
    .then(orderItem => { res.status(201).json({ status: 201,
      message: "Customer order item created", statusMessage: "created",
      item: orderItem.toJSON() })
    });
  }).catch(next);
});

/**
 * @swagger
 * /v1/:customerId/orders/:orderId/items/:orderItemId:
 *  delete:
 *    tags:
 *      - Orders
 *    description: Delete an order item
 *    produces:
 *      - application/json
 *    security:
 *      - Jwt: []
 *    responses:
 *      204:
 *        description: Deleted
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.delete("/:customerId/orders/:orderId/items/:orderItemId",
 auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.order == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { orderItem: "Not found" } });
    }

    return OrderItem.getItem(req.orderId, req.orderItemId).then(orderItem => {
      if(orderItem == null)
        return Promise.reject();

      return orderItem.destroy();
    }).then(() => res.sendStatus(204));
  }).catch(next);
});

module.exports = router;
