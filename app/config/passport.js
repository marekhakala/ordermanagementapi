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
import { Strategy as LocalStrategy } from "passport-local";
const Account = require("../models/account");

passport.use(new LocalStrategy({
  usernameField: "account[email]", passwordField: "account[password]"
}, (email, password, done) => {
  Account.findOne({ where: { email: email }}).then(account => {
    if(!account || !account.validPassword(password)) {
      return done(null, false, { status: 422, message: "Unprocessable Entity",
       statusMessage: "error", errors: { "email or password": "is invalid" }});
    }
    return done(null, account);
  }).catch(done);
}));
