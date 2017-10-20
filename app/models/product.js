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

const Product = connection.define("product", {
  code: {
    type: Sequelize.STRING,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: { notEmpty: { msg: "The product name is required." }}
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
    validate: { notEmpty: { msg: "The product description is required." }}
  },
  price: {
    type: Sequelize.FLOAT,
    validate: { notEmpty: { msg: "The product price is required." }},
    allowNull: false,
    defaultValue: 0.0
  },
  priceWithVat: {
    type: Sequelize.FLOAT,
    validate: { notEmpty: { msg: "The product price with VAT is required." }},
    allowNull: false,
    defaultValue: 0.0
  },
  photo: {
    type: Sequelize.STRING,
    allowNull: true,
    defaultValue: ""
  }
});

Product.seedProduct = (product) => {
  const productParams = {
    code: (typeof product.code !== "undefined") ? product.code : "",
    name: (typeof product.name !== "undefined") ? product.name : "",
    description: (typeof product.description !== "undefined") ? product.description : "",
    price: (typeof product.price !== "undefined") ? product.price : 0.0,
    priceWithVat: (typeof product.priceWithVat !== "undefined") ? product.priceWithVat : 0.0,
    photo: (typeof product.photoSeed !== "undefined") ? product.photoSeed : "" };
  return Product.create(productParams);
}

Product.createProduct = (product) => {
  const productParams = {
    code: (typeof product.code !== "undefined") ? product.code : "",
    name: (typeof product.name !== "undefined") ? product.name : "",
    description: (typeof product.description !== "undefined") ? product.description : "",
    price: (typeof product.price !== "undefined") ? product.price : 0.0,
    priceWithVat: (typeof product.priceWithVat !== "undefined") ? product.priceWithVat : 0.0,
    photo: (typeof product.photo !== "undefined") ? product.photo : "" };
  return Product.create(productParams);
}

Product.validateBeforeCreate = (productParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(!productParams) {
    errorsHash.code = errorMessage;
    errorsHash.name = errorMessage;
    errorsHash.price = errorMessage;
    errorsHash.priceWithVat = errorMessage;
    errorsCount = 4;
  } else {
    if(typeof productParams.code === "undefined") {
      errorsHash.code = errorMessage;
      errorsCount++;
    }
    if(typeof productParams.name === "undefined") {
      errorsHash.name = errorMessage;
      errorsCount++;
    }
    if(typeof productParams.price === "undefined") {
      errorsHash.price = errorMessage;
      errorsCount++;
    }
    if(typeof productParams.priceWithVat === "undefined") {
      errorsHash.priceWithVat = errorMessage;
      errorsCount++;
    }
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Product.validateBeforeUpdate = (productParams) => {
  let errorsCount = 0;
  let errorsHash = {};
  let errorMessage = "Can't be blank.";

  if(typeof productParams.name !== "undefined"
  && productParams.name.length < 1) {
    errorsHash.name = errorMessage;
    errorsCount++;
  }
  return { errorsHash: errorsHash, errorsCount: errorsCount };
}

Product.updateProduct = (product, updateParams) => {
  let updateData = {};

  if(typeof updateParams.code !== "undefined") {
    updateData.code = updateParams.code;
  }
  if(typeof updateParams.name !== "undefined") {
    updateData.name = updateParams.name;
  }
  if(typeof updateParams.description !== "undefined") {
    updateData.description = updateParams.description;
  }
  if(typeof updateParams.price !== "undefined") {
    updateData.price = updateParams.price;
  }
  if(typeof updateParams.priceWithVat !== "undefined") {
    updateData.priceWithVat = updateParams.priceWithVat;
  }
  if(typeof updateParams.photo !== "undefined") {
    updateData.photo = updateParams.photo;
  }

  Object.assign(product, updateData);
  return product.save();
}

Product.getProduct = (id) => {
  return Product.findById(id);
}

Product.allProducts = () => {
  return Product.getProducts({});
}

Product.searchProducts = (expression) => {
  return Product.getProducts({ name: { [Sequelize.Op.iLike]: "%" + expression + "%" } });
}

Product.getProducts = (whereClause) => {
  return Product.findAll({ where: whereClause, order: [["createdAt", "DESC"]] });
}

Product.getBaseLocalPhotoPath = () => {
  return appConfig["photosPath"]["base"]
  + appConfig["photosPath"]["products"];
}

Product.prototype.getLocalPhotoPath = function() {
  return appConfig["photosPath"]["base"]
  + appConfig["photosPath"]["products"] + this.photo;
}

Product.prototype.toJSON = function() {
  return { id: this.id, code: this.code, name: this.name,
    description: this.description, price: this.price,
    priceWithVat: this.priceWithVat, photo: this.photo,
    updatedAt: this.updatedAt, createdAt: this.createdAt };
}

module.exports = Product;
