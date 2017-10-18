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
