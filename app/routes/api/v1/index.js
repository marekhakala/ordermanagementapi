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

import express from "express";
const router = express.Router();

router.use((err, req, res, next) => {
  if(err.name === "ValidationError") {
    return res.status(422).json({ status: 422,
      message: "Invalid data", statusMessage: "error",
      errors: Object.keys(err.errors).reduce((errors, key) => {
        errors[key] = err.errors[key].message;
        return errors;
      }, {})
    });
  } else if (err.name === "UnauthorizedError") {
    return res.status(401).json({ status: 401,
      message: "Unauthorized", statusMessage: "error",
      errors: { "Token" : "No authorization token was found." }
    });
  }
  return next(err);
});

module.exports = router;
