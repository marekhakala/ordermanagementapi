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
