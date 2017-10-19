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

import chai from "chai";
import chaiHttp from "chai-http";
import server from "../server";

const connection = require("../app/models/connection");
const { Account } = require("../app/models/index").models;
const should = chai.should();
chai.use(chaiHttp);

describe("Accounts", () => {
  let accountId = null;
  let apiToken = null;

  let errorMessageEmailTakenField = "Is already taken.";
  let errorMessageBlankField = "Can't be blank.";

  let accountParams = { account: { fullname: "Demo Demo",
   email: "demo@demo.com", password: "demodemo" } };
  let accountEditParams = { account: { fullname: "Edit Edit",
   email: "edit@edit.com", password: "editedit" } };
  let accountSecondParams = { account: { fullname: "Demo Demo",
   email: "seconddemo@demo.com", password: "abc123abc" } };

  before(done => {
    chai.request(server)
      .post("/api/v1/accounts")
      .send(accountParams)
      .end((err, res) => {
        res.should.have.status(201);
        accountId = res.body["account"]["id"];
        apiToken = res.body["account"]["token"];
        done();
    });
  });

  //
  // Test - GET /api/v1/account (Show info)
  //
  describe("GET /api/v1/account", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .get("/api/v1/account")
		    .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(401);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          done();
		    });
	  });

    it("it should receive an account information", done => {
      chai.request(server)
        .get("/api/v1/account")
        .set("authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");

          res.body.should.have.property("account");
          res.body.account.should.not.be.null;
          res.body.account.should.have.property("id");
          res.body.account.id.should.not.be.null;
          res.body.account.should.have.property("fullname");
          res.body.account.fullname.should.not.be.null;
          res.body.account.fullname.should.equal(accountParams["account"]["fullname"]);
          res.body.account.should.have.property("email");
          res.body.account.email.should.not.be.null;
          res.body.account.email.should.equal(accountParams["account"]["email"]);
          res.body.account.should.have.property("token");
          res.body.account.token.should.not.be.null;
          done();
        });
    });
  });

  //
  // Test - POST /api/v1/accounts/signin (Sign In)
  //
  describe("POST /api/v1/accounts/signin", () => {
    it("it should receive an error - empty account values", done => {
			chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({})
      .end((err, res) => {
			  	res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.not.be.null;
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - empty account values", done => {
      chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({ account: {} })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.not.be.null;
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty email and password", done => {
      chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({ account: {} })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.not.be.null;
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty email", done => {
      chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({ account: { password: accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.not.be.null;
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty password", done => {
      chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({ account: { email: accountParams["account"]["email"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - email or password is invalid", done => {
      chai.request(server)
      .post("/api/v1/accounts/signin")
      .send({ account: { email: accountParams["account"]["email"],
       password: accountParams["account"]["password"] + accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("email or password");
          done();
        });
    });
  });

  //
  // Test - PUT /api/v1/account (Update)
  //
  describe("PUT /api/v1/account", () => {
    it("it should receive a token error", done => {
      chai.request(server)
        .put("/api/v1/account")
        .send({ account: { fullname: accountSecondParams["account"]["fullname"],
         password: accountSecondParams["account"]["password"] } })
        .end((err, res) => {
          res.should.have.status(401);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(401);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          done();
        });
    });

    it("it should receive an error - current password is not correct #1", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({})
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("currentPassword");
          res.body.errors.currentPassword.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - current password is not correct #2", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: {} })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("currentPassword");
          res.body.errors.currentPassword.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - current password is not correct #3", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: { fullname: accountEditParams["account"]["fullname"],
       password: accountEditParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("currentPassword");
          res.body.errors.currentPassword.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - empty fullname", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: { fullname: "",
       currentPassword: accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - empty password", done => {
      chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: { password: "",
       currentPassword: accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive a updated full name", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: { fullname: accountEditParams["account"]["fullname"],
       currentPassword: accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("updated");

          res.body.should.have.property("account");
          res.body.account.should.have.property("fullname");
          res.body.account.fullname.should.equal(accountEditParams["account"]["fullname"]);
          done();
		    });
	  });

    it("it should receive an updated password", done => {
			chai.request(server)
      .put("/api/v1/account")
      .set("authorization", "Token " + apiToken)
      .send({ account: { password: accountEditParams["account"]["password"],
       currentPassword: accountParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("updated");

          chai.request(server)
          .post("/api/v1/accounts/signin")
          .send({ account: { email: accountParams["account"]["email"],
           password: accountEditParams["account"]["password"] } })
          .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property("status");
              res.body.status.should.be.equal(200);
              res.body.should.have.property("message");
              res.body.should.have.property("statusMessage");
              res.body.statusMessage.should.be.equal("ok");

              res.body.should.have.property("account");
              res.body.account.should.not.be.null;
              res.body.account.should.have.property("id");
              res.body.account.id.should.not.be.null;
              res.body.account.should.have.property("fullname");
              res.body.account.fullname.should.not.be.null;
              res.body.account.should.have.property("email");
              res.body.account.email.should.not.be.null;
              res.body.account.should.have.property("token");
              res.body.account.token.should.not.be.null;
              done();
            });
		    });
	  });
  });

  //
  // Test - POST /api/v1/accounts (Create)
  //
  describe("POST /api/v1/accounts", () => {
    it("it should receive an error - empty account values", done => {
			chai.request(server)
      .post("/api/v1/accounts")
      .send({})
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
		    });
	  });

    it("it should receive an error - empty fullname, email, and password", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: {} })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty email and password", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { fullname: accountSecondParams["account"]["fullname"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty fullname and password", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { email: accountSecondParams["account"]["email"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty fullname and email", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { password: accountSecondParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty fullname", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { email: accountSecondParams["account"]["email"],
       password: accountSecondParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.should.have.property("errors");
          res.body.errors.should.have.property("fullname");
          res.body.errors.fullname.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty email", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { fullname: accountSecondParams["account"]["fullname"],
       password: accountSecondParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive an error - empty password", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { fullname: accountSecondParams["account"]["fullname"],
       email: accountSecondParams["account"]["email"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("password");
          res.body.errors.password.should.equal(errorMessageBlankField);
          done();
        });
    });

    it("it should receive a new account", done => {
      chai.request(server)
        .post("/api/v1/accounts")
        .send(accountSecondParams)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(201);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");

          res.body.should.have.property("account");
          res.body.account.should.not.be.null;
          res.body.account.should.have.property("id");
          res.body.account.id.should.not.be.null;
          res.body.account.should.have.property("fullname");
          res.body.account.fullname.should.not.be.null;
          res.body.account.fullname.should.equal(accountSecondParams["account"]["fullname"]);
          res.body.account.should.have.property("email");
          res.body.account.email.should.not.be.null;
          res.body.account.email.should.equal(accountSecondParams["account"]["email"]);
          res.body.account.should.have.property("token");
          res.body.account.token.should.not.be.null;
          done();
        });
    });

    it("it should receive an error - duplicate email", done => {
      chai.request(server)
      .post("/api/v1/accounts")
      .send({ account: { fullname: accountSecondParams["account"]["fullname"],
       email: accountSecondParams["account"]["email"],
       password: accountSecondParams["account"]["password"] } })
      .end((err, res) => {
          res.should.have.status(422);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(422);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          res.body.errors.should.have.property("email");
          res.body.errors.email.should.equal(errorMessageEmailTakenField);
          done();
        });
    });
  });

  //
  // Test - DELETE /api/v1/accounts/signout (Sign Out)
  //
  describe("DELETE /api/v1/accounts/signout", () => {
    it("it should receive an error - unauthorized", done => {
      chai.request(server)
      .delete("/api/v1/accounts/signout")
      .set("authorization", "Token " + apiToken)
      .send({})
      .end((err, res) => {
          res.should.have.status(204);
          chai.request(server)
            .get("/api/v1/account")
            .set("authorization", "Token " + apiToken)
            .end((err, res) => {
              res.should.have.status(401);
              res.body.should.have.property("status");
              res.body.status.should.be.equal(401);
              res.body.should.have.property("message");
              res.body.should.have.property("statusMessage");
              res.body.statusMessage.should.be.equal("error");
              done();
          });
       });
    });
  });
});
