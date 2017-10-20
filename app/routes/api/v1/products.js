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
const { Account, Product } = require("./../../../models/index").models;

const mime = require("mime-types");
const multer = require("multer");
const { OnFileFilter, OnFilename } = require("./../../../config/multer");

const storage = multer.diskStorage({
  destination: (req, file, cb) => { cb(null, Product.getBaseLocalPhotoPath());
  }, filename: OnFilename });
const upload = multer({ fileFilter: OnFileFilter, storage: storage });
const productUpload = upload.single("photo");

const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");

import auth from "../../auth";

router.param("productId", (req, res, next, id) => {
  Product.getProduct(id).then(product => {
    req.product = (product) ? product : null;
    return next();
  });
});

router.get("/", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    let productsQuery;
    if(typeof req.query.search !== "undefined") {
      productsQuery = Product.searchProducts(req.query.search);
    } else {
      productsQuery = Product.allProducts();
    }

    return productsQuery.then(products => res.status(200).json({ status: 200,
      message: "Product list", statusMessage: "ok",
      products: products.map(product => product.toJSON()),
      count: products.length }));
  }).catch(next);
});

router.post("/", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    const validationResult = Product.validateBeforeCreate(req.body.product);
    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable product entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Product.createProduct(req.body.product)
    .then(product => res.status(201).json({ status: 201,
      message: "Product created", statusMessage: "created",
      product: product.toJSON() }));
  }).catch(next);
});

router.get("/:productId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.product == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { product: "Not found" } });
    }

    return res.status(200).json({ status: 200, message: "Get",
      statusMessage: "ok", product: req.product.toJSON() });
  }).catch(next);
});

router.put("/:productId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.product == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { product: "Not found" } });
    }

    const validationResult = Product.validateBeforeUpdate(req.body.product);

    if(validationResult.errorsCount > 0) {
      return res.status(422).json({ status: 422,
        message: "Unprocessable product entity",
        statusMessage: "error", errors: validationResult.errorsHash });
    }

    return Product.updateProduct(req.product, req.body.product)
    .then(product => res.status(201).json({ status: 201, message: "Product updated",
        statusMessage: "updated", product: product.toJSON() }));
  }).catch(next);
});

router.delete("/:productId", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.product == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { product: "Not found" } });
    }

    return req.product.destroy()
    .then(() => res.sendStatus(204));
  }).catch(next);
});

router.get("/:productId/photo", auth.required, (req, res, next) => {
   Account.validateAccount(req.payload).then(account => {
     if(account == null) {
       return res.status(401).json({ status: 401,
         message: "Unauthorized", statusMessage: "error",
         errors: { token: "Invalid" } });
     }

     if(req.product == null
       || req.product.photo == null || req.product.photo == ""
       || !fs.existsSync(path.resolve(req.product.getLocalPhotoPath()))) {
       return res.status(404).json({ status: 404,
         message: "Not found", statusMessage: "error",
         errors: { product: "Not found" } });
     }

     return res.sendFile(path.resolve(req.product.getLocalPhotoPath()));
  }).catch(next);
});

router.post("/:productId/photo", auth.required, (req, res, next) => {
  productUpload(req, res, (err) => {
    Account.validateAccount(req.payload).then(account => {
      if(account == null) {
        return res.status(401).json({ status: 401,
          message: "Unauthorized", statusMessage: "error",
          errors: { token: "Invalid" } });
      }

      if(req.product == null) {
        return res.status(404).json({ status: 404,
          message: "Not found", statusMessage: "error",
          errors: { product: "Not found" } });
      }

      if(err || !req.file) {
        return res.status(422).json({ status: 422,
          message: "Unprocessable product entity",
          statusMessage: "error", errors: { photo: "Invalid photo image format" } });
      }

      if(req.file == null) {
        return res.status(422).json({ status: 422,
          message: "Unprocessable product entity",
          statusMessage: "error", errors: { photo: "Data corrupted" } });
      }

      if(req.product.photo != "" && fs.existsSync(req.product.getLocalPhotoPath())) {
        fse.removeSync(req.product.getLocalPhotoPath());
      }

      req.product.photo = req.file.filename;
      return req.product.save().then(product => res.status(201).json({
        status: 201, message: "Product updated",
        statusMessage: "updated", product: product.toJSON() }));
   }).catch(next);
  });
});

router.delete("/:productId/photo", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then(account => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error",
        errors: { token: "Invalid" } });
    }

    if(req.product == null || req.product.photo == null) {
      return res.status(404).json({ status: 404,
        message: "Not found", statusMessage: "error",
        errors: { product: "Not found" } });
    }

    if(fs.existsSync(req.product.getLocalPhotoPath())) {
      fse.removeSync(req.product.getLocalPhotoPath());
    }

    req.product.photo = "";
    return req.product.save().then(product => res.status(200).json({
      status: 200, message: "Product updated",
      statusMessage: "updated", product: product.toJSON() }));
  }).catch(next);
});

module.exports = router;
