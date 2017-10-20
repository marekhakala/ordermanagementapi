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
const mime = require("mime-types");

let OnFileFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
    return cb(new Error("Only jpg, jpeg, and png files are allowed!"), false);
  }
  cb(null, true);
}

let OnFilename = (req, file, cb) => {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(null, raw.toString("hex") + "_" + Date.now() + "." + mime.extension(file.mimetype));
  });
};

module.exports = { OnFileFilter, OnFilename };
