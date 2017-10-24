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

const Seeder = require("./../seed-db");
const connection = require("../app/models/connection");
const { Account, Customer, Order, OrderItem } = require("../app/models/index").models;
const should = chai.should();
const { readFileSync } = require("fs");
chai.use(chaiHttp);

describe("Customers", () => {
  let accountId = null;
  let apiToken = null;
  let customerId = null;

  let errorMessageEmailTakenField = "Is already taken.";
  let errorMessageBlankField = "Can't be blank.";
  let accountParams = { account: { fullname: "Test Test",
   email: "test@test.com", password: "demodemo" } };

  let searchExpression = "Alex";
  let customerParams = { customer: { firstName: "Alex", lastName: "Levenstine",
    phone: "19993215661", email: "alex.levenstine@yy.com" } };
  let editCustomerParams = { customer: { firstName: "Arron", lastName: "Nahamee",
    phone: "17774398549", email: "arron.nahamee@be.com" } };
  let emptyNameCustomerParams = { customer: { firstName: "", lastName: "",
    phone: "17774398549", email: "robin.papercut@beee.co" } };

  before(done => {
    Seeder().then(() => {
      return chai.request(server)
         .post("/api/v1/accounts")
         .send(accountParams);
    }).then(res => {
      res.should.have.status(201);
      res.body.should.have.property("status");
      res.body.status.should.be.equal(201);

      accountId = res.body["account"]["id"];
      apiToken = res.body["account"]["token"];
      done();
    }).catch(done);
  });

  //
  // Test - GET /api/v1/customers (Index)
  //
  describe("GET /api/v1/customers", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .get("/api/v1/customers")
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

    it("it should receive a list of customers", done => {
      chai.request(server)
        .get("/api/v1/customers")
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");
          res.body.should.have.property("customers");

          for(let i = 0; i < res.body.customers.length; i++) {
            res.body.customers[i].should.not.be.null;
            res.body.customers[i].should.have.property("id");
            res.body.customers[i].id.should.not.be.null;
            res.body.customers[i].should.have.property("firstName");
            res.body.customers[i].firstName.should.not.be.null;
            res.body.customers[i].should.have.property("lastName");
            res.body.customers[i].lastName.should.not.be.null;
            res.body.customers[i].should.have.property("phone");
            res.body.customers[i].phone.should.not.be.null;
            res.body.customers[i].should.have.property("email");
            res.body.customers[i].email.should.not.be.null;
            res.body.customers[i].should.have.property("photo");
            res.body.customers[i].photo.should.not.be.null;
            res.body.customers[i].should.have.property("updatedAt");
            res.body.customers[i].updatedAt.should.not.be.null;
            res.body.customers[i].should.have.property("createdAt");
            res.body.customers[i].createdAt.should.not.be.null;
          }

          res.body.should.have.property("count");
          res.body.count.should.be.eq(res.body.customers.length);
          done();
        });
    });

    it("it should receive a search result", done => {
      chai.request(server)
        .get("/api/v1/customers?search=" + searchExpression)
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");
          res.body.should.have.property("customers");

          for(let i = 0; i < res.body.customers.length; i++) {
            res.body.customers[i].should.not.be.null;
            res.body.customers[i].should.have.property("id");
            res.body.customers[i].id.should.not.be.null;
            res.body.customers[i].should.have.property("firstName");
            res.body.customers[i].firstName.should.not.be.null;
            res.body.customers[i].should.have.property("lastName");
            res.body.customers[i].lastName.should.not.be.null;
            res.body.customers[i].should.have.property("phone");
            res.body.customers[i].phone.should.not.be.null;
            res.body.customers[i].should.have.property("email");
            res.body.customers[i].email.should.not.be.null;
            res.body.customers[i].should.have.property("photo");
            res.body.customers[i].photo.should.not.be.null;
            res.body.customers[i].should.have.property("updatedAt");
            res.body.customers[i].updatedAt.should.not.be.null;
            res.body.customers[i].should.have.property("createdAt");
            res.body.customers[i].createdAt.should.not.be.null;
          }

          res.body.should.have.property("count");
          res.body.count.should.be.eq(res.body.customers.length);
          res.body.count.should.be.eq(1);
          done();
        });
    });
  });

  //
  // Test - POST /api/v1/customers (Create)
  //
  describe("POST /api/v1/customers", () => {
    it("it should receive a token error", done => {
      chai.request(server)
          .post("/api/v1/customers")
          .send(customerParams)
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

    it("it should receive an error - empty first and last name", done => {
      chai.request(server)
          .post("/api/v1/customers")
          .set("Authorization", "Token " + apiToken)
          .send(emptyNameCustomerParams)
          .end((err, res) => {
            res.should.have.status(422);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(422);
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("error");

            res.body.should.have.property("errors");
            res.body.errors.should.have.property("firstName");
            res.body.errors.firstName.should.not.be.null;
            res.body.errors.should.have.property("lastName");
            res.body.errors.lastName.should.not.be.null;
            done();
          });
    });

    it("it should receive a new customer", done => {
        chai.request(server)
          .post("/api/v1/customers")
          .set("Authorization", "Token " + apiToken)
          .send(customerParams)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(201);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("created");
            res.body.should.have.property("customer");

            res.body.customer.should.not.be.null;
            res.body.customer.should.have.property("id");
            res.body.customer.id.should.not.be.null;
            customerId = res.body.customer.id;
            res.body.customer.should.have.property("firstName");
            res.body.customer.firstName.should.not.be.null;
            res.body.customer.should.have.property("lastName");
            res.body.customer.lastName.should.not.be.null;
            res.body.customer.should.have.property("phone");
            res.body.customer.phone.should.not.be.null;
            res.body.customer.should.have.property("email");
            res.body.customer.email.should.not.be.null;
            res.body.customer.should.have.property("photo");
            res.body.customer.photo.should.not.be.null;
            res.body.customer.should.have.property("ordersCount");
            res.body.customer.ordersCount.should.not.be.null;
            res.body.customer.should.have.property("updatedAt");
            res.body.customer.updatedAt.should.not.be.null;
            res.body.customer.should.have.property("createdAt");
            res.body.customer.createdAt.should.not.be.null;
            done();
        });
    });
  });

  //
  // Test - GET /api/v1/customers/:customerId (Show)
  //
  describe("GET /api/v1/customers/:customerId", () => {
    it("it should receive a token error", done => {
      chai.request(server)
        .get("/api/v1/customers/" + customerId)
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

    it("it should receive a customer", done => {
      chai.request(server)
        .get("/api/v1/customers/" + customerId)
        .set("Authorization", "Token " + apiToken)
        .send(customerParams)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");

          res.body.should.have.property("customer");
          res.body.customer.should.not.be.null;
          res.body.customer.should.have.property("id");
          res.body.customer.id.should.not.be.null;
          res.body.customer.should.have.property("firstName");
          res.body.customer.firstName.should.not.be.null;
          res.body.customer.should.have.property("lastName");
          res.body.customer.lastName.should.not.be.null;
          res.body.customer.should.have.property("phone");
          res.body.customer.phone.should.not.be.null;
          res.body.customer.should.have.property("email");
          res.body.customer.email.should.not.be.null;
          res.body.customer.should.have.property("photo");
          res.body.customer.photo.should.not.be.null;

          res.body.customer.should.have.property("orders");
          for(let i = 0; i < res.body.customer.orders.length; i++) {
              res.body.customer.orders[i].should.have.property("id");
              res.body.customer.orders[i].id.should.not.be.null;
              res.body.customer.orders[i].should.have.property("totalPrice");
              res.body.customer.orders[i].totalPrice.should.not.be.null;
              res.body.customer.orders[i].should.have.property("totalPriceWithVat");
              res.body.customer.orders[i].totalPriceWithVat.should.not.be.null;
              res.body.customer.orders[i].should.have.property("issuedAt");
              res.body.customer.orders[i].issuedAt.should.not.be.null;
              res.body.customer.orders[i].should.have.property("updatedAt");
              res.body.customer.orders[i].updatedAt.should.not.be.null;
              res.body.customer.orders[i].should.have.property("createdAt");
              res.body.customer.orders[i].createdAt.should.not.be.null;
          }

          res.body.customer.should.have.property("ordersCount");
          res.body.customer.ordersCount.should.not.be.null;
          res.body.customer.should.have.property("updatedAt");
          res.body.customer.updatedAt.should.not.be.null;
          res.body.customer.should.have.property("createdAt");
          res.body.customer.createdAt.should.not.be.null;
          done();
      });
    });
  });

  //
  // Test - PUT /api/v1/customers/:customerId (Edit)
  //
  describe("PUT /api/v1/customers/:customerId", () => {
    it("it should receive a token error", done => {
      chai.request(server)
        .put("/api/v1/customers/" + customerId)
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

    it("it should receive a updated customer", done => {
      chai.request(server)
        .put("/api/v1/customers/" + customerId)
        .set("Authorization", "Token " + apiToken)
        .send(editCustomerParams)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(201);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("updated");

          res.body.should.have.property("customer");
          res.body.customer.should.not.be.null;
          res.body.customer.should.have.property("id");
          res.body.customer.id.should.not.be.null;
          res.body.customer.should.have.property("firstName");
          res.body.customer.firstName.should.not.be.null;
          res.body.customer.firstName.should.be.eq(editCustomerParams.customer.firstName);
          res.body.customer.should.have.property("lastName");
          res.body.customer.lastName.should.not.be.null;
          res.body.customer.lastName.should.be.eq(editCustomerParams.customer.lastName);
          res.body.customer.should.have.property("phone");
          res.body.customer.phone.should.not.be.null;
          res.body.customer.phone.should.be.eq(editCustomerParams.customer.phone);
          res.body.customer.should.have.property("email");
          res.body.customer.email.should.not.be.null;
          res.body.customer.email.should.be.eq(editCustomerParams.customer.email);
          res.body.customer.should.have.property("photo");
          res.body.customer.photo.should.not.be.null;
          res.body.customer.should.have.property("updatedAt");
          res.body.customer.updatedAt.should.not.be.null;
          res.body.customer.should.have.property("createdAt");
          res.body.customer.createdAt.should.not.be.null;
          done();
      });
    });
  });

  //
  // Test - POST /api/v1/customers/:customerId/photo (Add / Update)
  //
  describe("POST /api/v1/customers/:customerId/photo", () => {
    it("it should receive a token error", done => {
      chai.request(server)
        .post("/api/v1/customers/" + customerId + "/photo")
        .attach("photo", readFileSync("./seed/photos/customers/customer01.jpg"), "photo.jpg")
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

    it("it should receive the result after add or update photo", done => {
      chai.request(server)
        .post("/api/v1/customers/" + customerId + "/photo")
        .set("Authorization", "Token " + apiToken)
        .attach("photo", readFileSync("./seed/photos/customers/customer01.jpg"), "photo.jpg")
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(201);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("updated");

          res.body.should.have.property("customer");
          res.body.customer.should.not.be.null;
          res.body.customer.should.have.property("id");
          res.body.customer.id.should.not.be.null;
          res.body.customer.should.have.property("firstName");
          res.body.customer.firstName.should.not.be.null;
          res.body.customer.firstName.should.be.eq(editCustomerParams.customer.firstName);
          res.body.customer.should.have.property("lastName");
          res.body.customer.lastName.should.not.be.null;
          res.body.customer.lastName.should.be.eq(editCustomerParams.customer.lastName);
          res.body.customer.should.have.property("phone");
          res.body.customer.phone.should.not.be.null;
          res.body.customer.phone.should.be.eq(editCustomerParams.customer.phone);
          res.body.customer.should.have.property("email");
          res.body.customer.email.should.not.be.null;
          res.body.customer.email.should.be.eq(editCustomerParams.customer.email);
          res.body.customer.should.have.property("photo");
          res.body.customer.photo.should.not.be.null;
          res.body.customer.should.have.property("updatedAt");
          res.body.customer.updatedAt.should.not.be.null;
          res.body.customer.should.have.property("createdAt");
          res.body.customer.createdAt.should.not.be.null;
          done();
       });
     });
   });

   //
   // Test - GET /api/v1/:customerId/photo (Show)
   //
   describe("GET /api/v1/customers/:customerId/photo", () => {
     it("it should receive a token error", done => {
       chai.request(server)
         .get("/api/v1/customers/" + customerId + "/photo")
         .end((err, res) => {
           res.should.have.status(401);
           res.body.should.have.property("status");
           res.body.should.have.property("message");
           res.body.status.should.be.equal(401);
           res.body.should.have.property("statusMessage");
           res.body.statusMessage.should.be.equal("error");

           res.body.should.have.property("errors");
           done();
          });
     });

     it("it should receive a customer photo", done => {
       chai.request(server)
         .get("/api/v1/customers/" + customerId + "/photo")
         .set("Authorization", "Token " + apiToken)
         .end((err, res) => {
           res.should.have.status(200);
           done();
          });
      });
   });

   //
   // Test - DELETE /api/v1/customers/:customerId/photo (Delete)
   //
   describe("DELETE /api/v1/customers/:customerId/photo", () => {
     it("it should receive a token error", done => {
       chai.request(server)
          .delete("/api/v1/customers/" + customerId + "/photo")
          .end((err, res) => {
            res.should.have.status(401);
            res.body.should.have.property("status");
            res.body.should.have.property("message");
            res.body.status.should.be.equal(401);
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("error");

            res.body.should.have.property("errors");
            done();
       });
     });

     it("it should receive a customer information without photo", done => {
       chai.request(server)
          .delete("/api/v1/customers/" + customerId + "/photo")
          .set("Authorization", "Token " + apiToken)
          .end((err, res) => {
            res.should.have.status(200);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(200);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("updated");

            res.body.should.have.property("customer");
            res.body.customer.should.not.be.null;
            res.body.customer.should.have.property("id");
            res.body.customer.id.should.not.be.null;
            res.body.customer.should.have.property("firstName");
            res.body.customer.firstName.should.not.be.null;
            res.body.customer.firstName.should.be.eq(editCustomerParams.customer.firstName);
            res.body.customer.should.have.property("lastName");
            res.body.customer.lastName.should.not.be.null;
            res.body.customer.lastName.should.be.eq(editCustomerParams.customer.lastName);
            res.body.customer.should.have.property("phone");
            res.body.customer.phone.should.not.be.null;
            res.body.customer.phone.should.be.eq(editCustomerParams.customer.phone);
            res.body.customer.should.have.property("email");
            res.body.customer.email.should.not.be.null;
            res.body.customer.email.should.be.eq(editCustomerParams.customer.email);
            res.body.customer.should.have.property("photo");
            res.body.customer.photo.should.not.be.null;
            res.body.customer.should.have.property("updatedAt");
            res.body.customer.updatedAt.should.not.be.null;
            res.body.customer.should.have.property("createdAt");
            res.body.customer.createdAt.should.not.be.null;
            done();
           });
     });

     it("it should receive a not found error status", done => {
       chai.request(server)
           .get("/api/v1/customers/" + customerId + "/photo")
           .set("Authorization", "Token " + apiToken)
           .end((err, res) => {
             res.should.have.status(404);
             res.body.should.have.property("status");
             res.body.status.should.be.equal(404);
             res.body.should.have.property("message");
             res.body.should.have.property("statusMessage");
             res.body.statusMessage.should.be.equal("error");

             res.body.should.have.property("errors");
             done();
        });
     });
   });

   //
   // Test - DELETE /api/v1/customers/:customerId (Delete)
   //
   describe("DELETE /api/v1/customers/:customerId", () => {
     it("it should receive a token error", done => {
       chai.request(server)
          .delete("/api/v1/customers/" + customerId)
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

    it("it should delete a customer", done => {
       chai.request(server)
         .delete("/api/v1/customers/" + customerId)
         .set("Authorization", "Token " + apiToken)
         .end((err, res) => {
           res.should.have.status(204);
           done();
          });
    });

    it("it should receive a not found error status", done => {
      chai.request(server)
        .get("/api/v1/customers/" + customerId)
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(404);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(404);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          done();
      });
    });
  });
});
