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

describe("Orders", () => {
  let accountId = null;
  let apiToken = null;

  let orderItemId = null;
  let orderId = null;
  let customerId = null;

  let errorMessageEmailTakenField = "Is already taken.";
  let errorMessageBlankField = "Can't be blank.";
  let accountParams = { account: { fullname: "Test Test", email: "test@orders.com", password: "demodemo" } };
  let customerParams = { customer: { firstName: "Alex", lastName: "Levenstine",
    phone: "19993215661", email: "alex.levenstine@yy.com" } };
  let orderParams = { "order": {
    "items": [ { "productCode": "B00NBEWB4U", "price": 14.99,
            "priceWithVat": 18.14, "quantity": 4 },
          { "productCode": "B01MSIEKXG", "price": 594.99,
            "priceWithVat": 719.94, "quantity": 1 },
          { "productCode": "B00OTWQIZG", "price": 499.12,
            "priceWithVat": 603.95, "quantity": 2 } ] } };
  let orderItemParams = { "item": { "productCode": "B01MSIEKXG", "price": 594.99,
    "priceWithVat": 719.94, "quantity": 1 } };

  before(done => {
    Seeder().then(() => {
      return chai.request(server)
         .post("/api/v1/accounts")
         .send(accountParams);
    }).then(res => {
      res.body.should.have.property("status");
      res.body.status.should.be.equal(201);

      accountId = res.body["account"]["id"];
      apiToken = res.body["account"]["token"];

      return chai.request(server)
        .post("/api/v1/customers")
        .set("Authorization", "Token " + apiToken)
        .send(customerParams);
    }).then(res => {
      customerId = res.body["customer"]["id"];
    }).then(res => {
      return chai.request(server)
        .post("/api/v1/customers/" + customerId + "/orders")
        .set("Authorization", "Token " + apiToken)
        .send(orderParams);
    }).then(res => {
      orderId = res.body["order"]["id"];
      done();
    })
    .catch(done);
  });

/*
  after(done => {
    connection.close();
    done();
  });*/

  //
  // Test - GET /api/v1/customers/:customerId/orders (Index)
  //
  describe("GET /api/v1/customers/:customerId/orders", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .get("/api/v1/customers/" + customerId + "/orders")
		    .end((err, res) => {
          res.should.have.status(401);
          res.body.status.should.be.equal(401);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("error");

          res.body.should.have.property("errors");
          done();
		    });
	  });

    it("it should receive a list of customer orders", done => {
      chai.request(server)
		    .get("/api/v1/customers/" + customerId + "/orders")
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");

          res.body.should.have.property("orders");
          res.body.orders.should.not.be.null;

          for(let i = 0; i < res.body.orders.length; i++) {
            res.body.orders[i].should.have.property("id");
            res.body.count.should.not.be.null;
            res.body.orders[i].should.have.property("totalPrice");
            res.body.count.should.not.be.null;
            res.body.orders[i].should.have.property("totalPriceWithVat");
            res.body.count.should.not.be.null;
            res.body.orders[i].should.have.property("issuedAt");
            res.body.count.should.not.be.null;
            res.body.orders[i].should.have.property("updatedAt");
            res.body.count.should.not.be.null;
            res.body.orders[i].should.have.property("createdAt");
            res.body.count.should.not.be.null;
          }

          res.body.should.have.property("count");
          res.body.count.should.not.be.null;
          res.body.count.should.be.eq(1);
          done();
        });
    });
  });

  //
  // Test - POST /api/v1/customers/:customerId/orders (CREATE)
  //
  describe("POST /api/v1/customers/:customerId/orders", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .post("/api/v1/customers/" + customerId + "/orders")
        .send(orderParams)
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

    it("it should receive a new customer order", done => {
      chai.request(server)
		    .post("/api/v1/customers/" + customerId + "/orders")
        .set("Authorization", "Token " + apiToken)
        .send(orderParams)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(201);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("created");

          res.body.should.have.property("order");
          res.body.order.should.not.be.null;
          res.body.order.should.have.property("id");
          res.body.order.id.should.not.be.null;
          for(let i = 0; i < res.body.order.items.length; i++) {
            res.body.order.items[i].should.have.property("id");
            res.body.order.items[i].id.should.not.be.null;
            res.body.order.items[i].should.have.property("quantity");
            res.body.order.items[i].quantity.should.not.be.null;
            res.body.order.items[i].should.have.property("price");
            res.body.order.items[i].price.should.not.be.null;
            res.body.order.items[i].should.have.property("priceWithVat");
            res.body.order.items[i].priceWithVat.should.not.be.null;
            res.body.order.items[i].should.have.property("product");
            res.body.order.items[i].product.should.not.be.null;
          }
          res.body.order.should.have.property("totalPrice");
          res.body.order.totalPrice.should.not.be.null;
          res.body.order.should.have.property("totalPriceWithVat");
          res.body.order.totalPriceWithVat.should.not.be.null;
          res.body.order.should.have.property("issuedAt");
          res.body.order.issuedAt.should.not.be.null;
          res.body.order.should.have.property("updatedAt");
          res.body.order.updatedAt.should.not.be.null;
          res.body.order.should.have.property("createdAt");
          res.body.order.createdAt.should.not.be.null;
          done();
        });
    });
  });

  //
  // Test - GET /api/v1/customers/:customerId/orders/:orderId (Show)
  //
  describe("GET /api/v1/customers/:customerId/orders/:orderId", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .get("/api/v1/customers/" + customerId + "/orders/" + orderId)
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

    it("it should receive a customer order", done => {
      chai.request(server)
		    .get("/api/v1/customers/" + customerId + "/orders/" + orderId)
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");

          res.body.should.have.property("order");
          res.body.order.should.not.be.null;
          res.body.order.should.have.property("id");
          res.body.order.id.should.not.be.null;
          for(let i = 0; i < res.body.order.items.length; i++) {
            res.body.order.items[i].should.have.property("id");
            res.body.order.items[i].id.should.not.be.null;
            res.body.order.items[i].should.have.property("quantity");
            res.body.order.items[i].quantity.should.not.be.null;
            res.body.order.items[i].should.have.property("price");
            res.body.order.items[i].price.should.not.be.null;
            res.body.order.items[i].should.have.property("priceWithVat");
            res.body.order.items[i].priceWithVat.should.not.be.null;
            res.body.order.items[i].should.have.property("product");
          }
          res.body.order.should.have.property("totalPrice");
          res.body.order.totalPrice.should.not.be.null;
          res.body.order.should.have.property("totalPriceWithVat");
          res.body.order.totalPriceWithVat.should.not.be.null;
          res.body.order.should.have.property("issuedAt");
          res.body.order.issuedAt.should.not.be.null;
          res.body.order.should.have.property("updatedAt");
          res.body.order.updatedAt.should.not.be.null;
          res.body.order.should.have.property("createdAt");
          res.body.order.createdAt.should.not.be.null;
          done();
        });
    });
  });

  //
  // Test - POST /api/v1/customers/:customerId/orders/:orderId/items (Create)
  //
  describe("POST /api/v1/customers/:customerId/orders/:orderId/items", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .post("/api/v1/customers/" + customerId + "/orders/" + orderId + "/items")
        .send(orderItemParams)
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

    it("it should receive a new customer order item", done => {
      chai.request(server)
		    .post("/api/v1/customers/" + customerId + "/orders/" + orderId + "/items")
        .set("Authorization", "Token " + apiToken)
        .send(orderItemParams)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(201);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("created");

          res.body.should.have.property("item");
          res.body.item.should.not.be.null;
          res.body.item.should.have.property("id");
          res.body.item.id.should.not.be.null;
          orderItemId = res.body.item.id;
          res.body.item.should.have.property("quantity");
          res.body.item.quantity.should.not.be.null;
          res.body.item.should.have.property("price");
          res.body.item.price.should.not.be.null;
          res.body.item.should.have.property("priceWithVat");
          res.body.item.priceWithVat.should.not.be.null;
          res.body.item.should.have.property("product");
          done();
        });
    });
  });


  //
  // Test - DELETE /api/v1/customers/:customerId/orders/:orderId/items/:orderItemId (Delete)
  //
  describe("DELETE /api/v1/customers/:customerId/orders/:orderId/items/:orderItemId", () => {
    it("it should receive a token error", done => {
      chai.request(server)
         .delete("/api/v1/customers/" + customerId
          + "/orders/" + orderId + "/items/" + orderItemId)
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

    it("it should receive a confirmation that item deleted", done => {
      chai.request(server)
         .delete("/api/v1/customers/" + customerId
          + "/orders/" + orderId + "/items/" + orderItemId)
         .set("Authorization", "Token " + apiToken)
         .end((err, res) => {
           res.should.have.status(204);
           done();
          });
    });

    it("it should receive a not found error status", done => {
      chai.request(server)
          .delete("/api/v1/customers/" + customerId
           + "/orders/" + orderId + "/items/" + orderItemId)
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
  // Test - DELETE /api/v1/customers/:customerId/orders/:orderId (Delete)
  //
  describe("DELETE /api/v1/customers/:customerId/orders/:orderId", () => {
    it("it should receive a token error", done => {
      chai.request(server)
         .delete("/api/v1/customers/" + customerId + "/orders/" + orderId)
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

    it("it should receive a confirmation that order was deleted", done => {
      chai.request(server)
         .delete("/api/v1/customers/" + customerId + "/orders/" + orderId)
         .set("Authorization", "Token " + apiToken)
         .end((err, res) => {
           res.should.have.status(204);
           done();
          });
    });

    it("it should receive a not found error status", done => {
      chai.request(server)
          .delete("/api/v1/customers/" + customerId + "/orders/" + orderId)
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
