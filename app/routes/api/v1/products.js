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

/**
 * @swagger
 * definitions:
 *  Product:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Product ID
 *      code:
 *        type: string
 *        description: Product code
 *      name:
 *        type: string
 *        description: Product name
 *      description:
 *        type: string
 *        description: Product description
 *      price:
 *        type: number
 *        format: float
 *        description: Product price
 *      priceWithVat:
 *        type: number
 *        format: float
 *        description: Product price with VAT
 *      photo:
 *        type: string
 *        description: Product photo filename
 *      updatedAt:
 *        type: string
 *        format: date-time
 *        description: Order update timestamp
 *      createdAt:
 *        type: string
 *        format: date-time
 *        description: Order create timestamp
 *  ProductList:
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
 *      products:
 *        type: array
 *        items:
 *          $ref: "#/definitions/Product"
 *      count:
 *        type: integer
 *        description: The number of products
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

router.param("productId", (req, res, next, id) => {
  Product.getProduct(id).then(product => {
    req.product = (product) ? product : null;
    return next();
  });
});

/**
 * @swagger
 * /v1/products:
 *  get:
 *    tags:
 *      - Products
 *    description: Get products
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: search
 *        description: The filter expression for search by product name or subset of product name.
 *        in: url
 *        type: string
 *    responses:
 *      200:
 *        description: List of products
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ProductList"
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

/**
 * @swagger
 * /v1/products:
 *  post:
 *    tags:
 *      - Products
 *    description: Add a new product
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: product[code]
 *        description: Product code
 *        in: body
 *        type: string
 *        required: true
 *      - name: product[name]
 *        description: Product name
 *        in: body
 *        type: string
 *        required: true
 *      - name: product[description]
 *        description: Product description
 *        in: body
 *        type: string
 *      - name: product[price]
 *        description: Product price
 *        in: body
 *        type: number
 *        format: float
 *        required: true
 *      - name: product[priceWithVat]
 *        description: Product price with VAT
 *        in: body
 *        type: number
 *        format: float
 *        required: true
 *    responses:
 *      201:
 *        description: The product result
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
 *              $ref: "#/definitions/Product"
 *              description: Product item
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

/**
 * @swagger
 * /v1/products/:productId:
 *  get:
 *    tags:
 *      - Products
 *    description: Get a product
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: The product result
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
 *              $ref: "#/definitions/Product"
 *              description: Product item
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

/**
 * @swagger
 * /v1/products/:productId:
 *  put:
 *    tags:
 *      - Products
 *    description: Update a product
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: product[name]
 *        description: Product name
 *        in: body
 *        type: string
 *      - name: product[description]
 *        description: Product description
 *        in: body
 *        type: string
 *      - name: product[price]
 *        description: Product price
 *        in: body
 *        type: number
 *        format: float
 *      - name: product[priceWithVat]
 *        description: Product price with VAT
 *        in: body
 *        type: number
 *        format: float
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
 *            product:
 *              type: object
 *              $ref: "#/definitions/Product"
 *              description: Product item
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
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
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

/**
 * @swagger
 * /v1/products/:productId:
 *  delete:
 *    tags:
 *      - Products
 *    description: Delete a product
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
 *      404:
 *        description: Not found
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
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

/**
 * @swagger
 * /v1/products/:productId/photo:
 *  get:
 *    tags:
 *      - Products
 *    description: Get a product photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
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
 *            product:
 *              type: object
 *              $ref: "#/definitions/Product"
 *              description: Product item
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

/**
 * @swagger
 * /v1/products/:productId/photo:
 *  post:
 *    tags:
 *      - Products
 *    description: Add or update a product photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: photo
 *        description: Product photo
 *        in: body
 *        type: string
 *        format: binary
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
 *            product:
 *              type: object
 *              $ref: "#/definitions/Product"
 *              description: Product item
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
 *      422:
 *        description: Unprocessable Entity
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
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

/**
 * @swagger
 * /v1/products/:productId/photo:
 *  delete:
 *    tags:
 *      - Products
 *    description: Remove a product photo
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
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
 *            product:
 *              type: object
 *              $ref: "#/definitions/Product"
 *              description: Product item
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
