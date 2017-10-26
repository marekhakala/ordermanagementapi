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
const blacklist = require("./../../../config/jwtblacklist");
const { Account } = require("./../../../models/index").models;
import auth from "../../auth";

/**
 * @swagger
 * definitions:
 *  Account:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Account ID
 *      fullname:
 *        type: string
 *        description: First and last name
 *      email:
 *        type: string
 *        description: Email address
 *  AccountAuth:
 *    type: object
 *    properties:
 *      id:
 *        type: integer
 *        description: Account ID
 *      fullname:
 *        type: string
 *        description: First and last name
 *      email:
 *        type: string
 *        description: Email address
 *      token:
 *        type: string
 *        description: JWT auth token
 *  ErrorMessage:
 *    type: object
 *    properties:
 *      status:
 *        type: string
 *        description: Error type
 *      errors:
 *        $ref: "#/definitions/ErrorMessages"
 *  ErrorMessages:
 *    additionalProperties:
 *      type: string
 */

 /**
  * @swagger
  * /v1/accounts:
  *  post:
  *    tags:
  *      - Accounts
  *    description: Sign Up
  *    produces:
  *      - application/json
  *    parameters:
  *      - name: account[fullname]
  *        description: First and last name
  *        in: body
  *        type: string
  *      - name: account[email]
  *        description: Email address
  *        in: body
  *        type: string
  *        required: true
  *      - name: account[password]
  *        description: Password
  *        in: body
  *        type: string
  *        required: true
  *    responses:
  *      201:
  *        description: Account
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
  *      422:
  *        description: Unprocessable Entity
  *        schema:
  *          type: object
  *          $ref: "#/definitions/ErrorMessage"
  */
 router.post("/accounts", (req, res, next) => {
   let errorsCount = 0;
   let errorsHash = {};
   let errorMessage = "Can't be blank.";

   if(!req.body.account) {
     errorsHash.fullname = errorMessage;
     errorsHash.email = errorMessage;
     errorsHash.password = errorMessage;
     errorsCount = 3;
   } else {
     if(!req.body.account.fullname) {
       errorsHash.fullname = errorMessage;
       errorsCount++;
     }

     if(!req.body.account.email) {
       errorsHash.email = errorMessage;
       errorsCount++;
     }

     if(!req.body.account.password) {
       errorsHash.password = errorMessage;
       errorsCount++;
     }
   }

   if(errorsCount > 0) {
     return res.status(422).json({ status: 422,
       message: "Unprocessable product entity",
       statusMessage: "error", errors: errorsHash });
   }

   const accountParams = { fullname: req.body.account.fullname,
     email: req.body.account.email, password: req.body.account.password };

   Account.createAccount(accountParams).then((account) => {
     return res.status(201).json({ status: 201, message: "Account created",
         statusMessage: "ok", account: account.toAuthJSON() });
   }).catch((exception) => {
     let errorsCount = 0;
     let errorsHash = {};

     if(exception.errors) {
       for(let i = 0; i < exception.errors.length; i++) {
         let errorObject = exception.errors[i];

         if(errorObject && errorObject.path && errorObject.message) {
           errorsHash[errorObject.path] = errorObject.message;
           errorsCount++;
         }
       }
     }

     if(errorsCount > 0) {
       return res.status(422).json({ status: 422,
         message: "Unprocessable account entity",
         statusMessage: "error", errors: errorsHash });
     }

     errorsHash["Error"] = "Internal error";
     return res.status(422).json({ status: 422,
       message: "Unprocessable account entity",
       statusMessage: "error", errors: errorsHash });
   });
 });

 /**
  * @swagger
  * /v1/accounts/signin:
  *  post:
  *    tags:
  *      - Accounts
  *    description: Sign In
  *    produces:
  *      - application/json
  *    parameters:
  *      - name: account[email]
  *        description: Email address
  *        in: body
  *        type: string
  *        required: true
  *      - name: account[password]
  *        description: Password
  *        in: body
  *        type: string
  *        required: true
  *    responses:
  *      200:
  *        description: Account
  *        schema:
  *          type: object
  *          $ref: "#/definitions/AccountAuth"
  *      422:
  *        description: Unprocessable Entity
  *        schema:
  *          type: object
  *          $ref: "#/definitions/ErrorMessage"
  */
 router.post("/accounts/signin", (req, res, next) => {
   var errorsCount = 0;
   var errorsHash = {};
   var errorMessage = "Can't be blank.";

   if(!req.body.account) {
     errorsHash.email = errorMessage;
     errorsHash.password = errorMessage;
     errorsCount = 2;
   } else {
     if(!req.body.account.email) {
       errorsHash.email = errorMessage;
       errorsCount++;
     }

     if(!req.body.account.password) {
       errorsHash.password = errorMessage;
       errorsCount++;
     }
   }

   if(errorsCount > 0) {
     return res.status(422).json({ status: 422,
       message: "Unprocessable account entity",
       statusMessage: "error", errors: errorsHash });
   }

   passport.authenticate("local", { session: false },
   (err, account, info) => {
     if(err) { return next(err); }

     if(account) {
       account.token = account.generateJWT();
       return res.status(200).json({ status: 200,
           message: "Account authenticated",
           statusMessage: "ok", account: account.toAuthJSON() });
     } else {
       return res.status(422).json(info);
     }
   })(req, res, next);
 });

/**
 * @swagger
 * /v1/account:
 *  get:
 *    tags:
 *      - Accounts
 *    description: Get an account information
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    responses:
 *      200:
 *        description: Account
 *        schema:
 *          type: object
 *          $ref: "#/definitions/AccountAuth"
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.get("/account", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then((account) => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error" });
    }

    return res.status(200).json({ status: 200,
      message: "Account info", statusMessage: "ok",
      account: account.toAuthJSON() });
  }).catch(next);
});

/**
 * @swagger
 * /v1/account:
 *  put:
 *    tags:
 *      - Accounts
 *    description: Update an account information
 *    security:
 *      - Jwt: []
 *    produces:
 *      - application/json
 *    parameters:
 *      - name: account[currentPassword]
 *        description: Current password
 *        in: body
 *        type: string
 *        required: true
 *      - name: account[fullname]
 *        description: First and last name
 *        in: body
 *        type: string
 *      - name: account[password]
 *        description: New password
 *        in: body
 *        type: string
 *    responses:
 *      200:
 *        description: Account
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
 *              description: Account information
 *              $ref: "#/definitions/Account"
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
router.put("/account", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then((account) => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error" });
    }

    if(req.body.account && req.body.account.currentPassword) {
      var errorsCount = 0;
      var errorsHash = {};

      if(!account.validPassword(req.body.account.currentPassword)) {
        return res.status(422)
        .json({ status: 422, message: "Unprocessable account entity",
            statusMessage: "error",  errors: {
            currentPassword: "Current password isn't correct." }});
      }

      if(req.body.account.fullname != null) {
        if(req.body.account.fullname.length > 0) {
          account.fullname = req.body.account.fullname;
        } else {
          errorsHash.fullname = "Can't be blank.";
          errorsCount++;
        }
      }

      if(req.body.account.password != null) {
        if(req.body.account.password.length > 0) {
          account.setPassword(req.body.account.password);
        } else {
          errorsHash.password = "Can't be blank.";
          errorsCount++;
        }
      }

      if(errorsCount > 0) {
        return res.status(422).json({ status: 422,
          message: "Unprocessable account entity",
          statusMessage: "error", errors: errorsHash });
      }

      return account.save().then(() => {
        return res.status(200).json({ status: 200, message: "Account updated",
         statusMessage: "updated", account: account.toAuthJSON() });
      });
    } else {
      return res.status(422)
      .json({ status: 422, message: "Unprocessable account entity",
        statusMessage: "error", errors: { currentPassword: "Can't be blank." }});
    }
  }).catch(next);
});

/**
 * @swagger
 * /v1/accounts/signout:
 *  delete:
 *    tags:
 *      - Accounts
 *    description: Sign Out
 *    produces:
 *      - application/json
 *    security:
 *      - Jwt: []
 *    responses:
 *      204:
 *        description: Sign Out
 *      401:
 *        description: Unauthorized
 *        schema:
 *          type: object
 *          $ref: "#/definitions/ErrorMessage"
 */
router.delete("/accounts/signout", auth.required, (req, res, next) => {
  Account.validateAccount(req.payload).then((account) => {
    if(account == null) {
      return res.status(401).json({ status: 401,
        message: "Unauthorized", statusMessage: "error" });
    }

    blacklist.revoke(req.payload);
    return res.sendStatus(204);
  }).catch(next);
});

module.exports = router;
