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

const crypto = require("crypto");
const connection = require("./connection");
const Sequelize = connection.Sequelize;

const jwt = require("jsonwebtoken");
const secret = require("../config").secret;

const Account = connection.define("account", {
  fullname: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "The full name is required." }
    }
  },
  email: {
    type: Sequelize.STRING,
    unique: { msg: "Is already taken." },
    allowNull: false,
    validate: {
      isEmail: { msg: "The email is invalid." },
      notEmpty: { msg: "The email is required." }
    }
  },
  hash: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  salt: {
    type: Sequelize.TEXT,
    allowNull: true
  }
});

Account.processPassword = (password) => {
  let salt = crypto.randomBytes(16).toString("hex");
  let hash = crypto.pbkdf2Sync(password, salt, 10000, 512, "sha512").toString("hex");
  return { salt: salt, hash: hash };
}

Account.createAccount = (params) => {
  const password = Account.processPassword(params["password"]);
  const accountParams = { fullname: params["fullname"], email: params["email"],
     salt: password["salt"], hash: password["hash"] };
  return Account.create(accountParams);
}

Account.validateAccount = (payload) => {
  if(payload == null || typeof payload.id === "undefined"
    || typeof payload.email === "undefined") {
    return Promise.reject();
  }

  return Account.findById(payload.id).then(account => {
    return (account != null && account.email === payload.email) ? account : null;
  });
}

Account.prototype.setPassword = function(password) {
  const passwordHash = Account.processPassword(password);
  this.salt = passwordHash.salt;
  this.hash = passwordHash.hash;
}

Account.getRandId = (method = "base64") => {
  return crypto.randomBytes(64).toString(method);
}

Account.prototype.validPassword = function(password) {
  let hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
  return this.hash === hash;
}

Account.prototype.generateJWT = function() {
  let today = new Date();
  let exp = new Date(today);
  exp.setDate(today.getDate() + 60);

  return jwt.sign({ id: this.id, fullname: this.fullname, email: this.email,
     exp: parseInt(exp.getTime() / 1000) }, secret, { jwtid: Account.getRandId(),
     issuer: "ordermanagementapi", subject: "userInfo" });
}

Account.prototype.toJSON = function() {
  return { id: this.id, fullname: this.fullname, email: this.email };
}

Account.prototype.toAuthJSON = function() {
  return { id: this.id, fullname: this.fullname, email: this.email,
     token: this.generateJWT() };
}

module.exports = Account;
