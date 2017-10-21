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
const { Account, Product } = require("../app/models/index").models;
const should = chai.should();
const { readFileSync } = require("fs");

chai.use(chaiHttp);

describe("Products", () => {
  let accountId = null;
  let apiToken = null;
  let productId = null;

  let errorMessageEmailTakenField = "Is already taken.";
  let errorMessageBlankField = "Can't be blank.";
  let accountParams = { account: { fullname: "Test Test",
   email: "test@test.com", password: "demodemo" } };

  let searchExpression = "android";
  let productParams = { product: { code: "XXXTESTXXX", name: "My testing product",
     description: "Lorem ipsum Lorem ipsum", price: 99.88, priceWithVat: 120.86 } };
  let editProductParams = { product: { code: "YYYTESTYYY", name: "New testing product",
        description: "Ipsum Lorem Ipsum Lorem", price: 101.88, priceWithVat: 99.95 } };
  let emptyNameProductParams = { product: { code: "YYYTESTYYY", name: "",
        description: "Ipsum Lorem Ipsum Lorem", price: 101.88, priceWithVat: 99.95 } };

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
      done();
    }).catch(done);
  });

  after(done => {
    connection.close();
    done();
  });

  //
  // Test - GET /api/v1/products (Index)
  //
  describe("GET /api/v1/products", () => {
    it("it should receive a token error", done => {
			chai.request(server)
		    .get("/api/v1/products")
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

    it("it should receive a list of products", done => {
      chai.request(server)
        .get("/api/v1/products")
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");
          res.body.should.have.property("products");

          for(let i = 0; i < res.body.products.length; i++) {
            res.body.products[i].should.not.be.null;
            res.body.products[i].should.have.property("id");
            res.body.products[i].id.should.not.be.null;
            res.body.products[i].should.have.property("code");
            res.body.products[i].code.should.not.be.null;
            res.body.products[i].should.have.property("name");
            res.body.products[i].name.should.not.be.null;
            res.body.products[i].should.have.property("price");
            res.body.products[i].price.should.not.be.null;
            res.body.products[i].should.have.property("priceWithVat");
            res.body.products[i].priceWithVat.should.not.be.null;
            res.body.products[i].should.have.property("photo");
            res.body.products[i].should.have.property("updatedAt");
            res.body.products[i].updatedAt.should.not.be.null;
            res.body.products[i].should.have.property("createdAt");
            res.body.products[i].createdAt.should.not.be.null;
          }

          res.body.should.have.property("count");
          res.body.count.should.be.eq(res.body.products.length);
          done();
        });
    });

    it("it should receive a search result", done => {
      chai.request(server)
        .get("/api/v1/products?search=" + searchExpression)
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.have.property("status");
          res.body.status.should.be.equal(200);
          res.body.should.have.property("message");
          res.body.should.have.property("statusMessage");
          res.body.statusMessage.should.be.equal("ok");
          res.body.should.have.property("products");

          for(let i = 0; i < res.body.products.length; i++) {
            res.body.products[i].should.not.be.null;
            res.body.products[i].should.have.property("id");
            res.body.products[i].id.should.not.be.null;
            res.body.products[i].should.have.property("code");
            res.body.products[i].code.should.not.be.null;
            res.body.products[i].should.have.property("name");
            res.body.products[i].name.should.not.be.null;
            res.body.products[i].should.have.property("price");
            res.body.products[i].price.should.not.be.null;
            res.body.products[i].should.have.property("priceWithVat");
            res.body.products[i].priceWithVat.should.not.be.null;
            res.body.products[i].should.have.property("photo");
            res.body.products[i].should.have.property("updatedAt");
            res.body.products[i].updatedAt.should.not.be.null;
            res.body.products[i].should.have.property("createdAt");
            res.body.products[i].createdAt.should.not.be.null;
          }

          res.body.should.have.property("count");
          res.body.count.should.be.eq(1);
          done();
        });
    });
  });

  //
  // Test - POST /api/v1/products (Create)
  //
  describe("POST /api/v1/products", () => {
    it("it should receive a token error", done => {
  		chai.request(server)
  		  .post("/api/v1/products")
        .send(productParams)
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

     it("it should receive an error - empty product values", done => {
   		chai.request(server)
         .post("/api/v1/products")
         .set("Authorization", "Token " + apiToken)
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
             res.body.errors.should.have.property("code");
             res.body.errors.code.should.equal(errorMessageBlankField);
             res.body.errors.should.have.property("name");
             res.body.errors.name.should.equal(errorMessageBlankField);
             res.body.errors.should.have.property("price");
             res.body.errors.price.should.equal(errorMessageBlankField);
             res.body.errors.should.have.property("priceWithVat");
             res.body.errors.priceWithVat.should.equal(errorMessageBlankField);
             done();
   		    });
     });

     it("it should receive an error - empty product values", done => {
  			chai.request(server)
        .post("/api/v1/products")
        .set("Authorization", "Token " + apiToken)
        .send({ product: {} })
        .end((err, res) => {
  			  	res.should.have.status(422);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(422);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("error");

            res.body.should.have.property("errors");
            res.body.errors.should.not.be.null;
            res.body.errors.should.have.property("code");
            res.body.errors.code.should.equal(errorMessageBlankField);
            res.body.errors.should.have.property("name");
            res.body.errors.name.should.equal(errorMessageBlankField);
            res.body.errors.should.have.property("price");
            res.body.errors.price.should.equal(errorMessageBlankField);
            res.body.errors.should.have.property("priceWithVat");
            res.body.errors.priceWithVat.should.equal(errorMessageBlankField);
            done();
  		    });
     });

     it("it should create a new product", done => {
        chai.request(server)
          .post("/api/v1/products")
          .set("Authorization", "Token " + apiToken)
          .send(productParams)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property("status");
            res.body.should.have.property("message");
            res.body.status.should.be.equal(201);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("created");

            res.body.should.have.property("product");
            res.body.product.should.not.be.null;
            res.body.product.should.have.property("id");
            res.body.product.id.should.not.be.null;
            productId = res.body.product.id;
            res.body.product.should.have.property("code");
            res.body.product.code.should.not.be.null;
            res.body.product.should.have.property("name");
            res.body.product.name.should.not.be.null;
            res.body.product.should.have.property("price");
            res.body.product.price.should.not.be.null;
            res.body.product.should.have.property("priceWithVat");
            res.body.product.priceWithVat.should.not.be.null;
            res.body.product.should.have.property("photo");
            res.body.product.should.have.property("updatedAt");
            res.body.product.updatedAt.should.not.be.null;
            res.body.product.should.have.property("createdAt");
            res.body.product.createdAt.should.not.be.null;
            done();
          });
     });
  });

  //
  // Test - GET /api/v1/products/:productId (Show)
  //
  describe("GET /api/v1/products/:productId", () => {
    it("it should receive a token error", done => {
      chai.request(server)
        .get("/api/v1/products/" + productId)
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

     it("it should receive a product information", done => {
      chai.request(server)
         .get("/api/v1/products/" + productId)
         .set("Authorization", "Token " + apiToken)
         .end((err, res) => {
            res.should.have.status(200);
             res.body.should.have.property("status");
             res.body.status.should.be.equal(200);
             res.body.should.have.property("message");
             res.body.should.have.property("statusMessage");
             res.body.statusMessage.should.be.equal("ok");

             res.body.should.have.property("product");
             res.body.product.should.not.be.null;
             res.body.product.should.have.property("id");
             res.body.product.id.should.not.be.null;
             res.body.product.should.have.property("code");
             res.body.product.code.should.not.be.null;
             res.body.product.should.have.property("name");
             res.body.product.name.should.not.be.null;
             res.body.product.should.have.property("price");
             res.body.product.price.should.not.be.null;
             res.body.product.should.have.property("priceWithVat");
             res.body.product.priceWithVat.should.not.be.null;
             res.body.product.should.have.property("photo");
             res.body.product.should.have.property("updatedAt");
             res.body.product.updatedAt.should.not.be.null;
             res.body.product.should.have.property("createdAt");
             res.body.product.createdAt.should.not.be.null;
             done();
          });
     });

     it("it should receive an error - the product doesn't exist", done => {
        chai.request(server)
        .get("/api/v1/products/123456789")
        .set("Authorization", "Token " + apiToken)
        .end((err, res) => {
            res.should.have.status(404);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(404);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("error");
            done();
          });
     });
   });

   //
   // Test - PUT /api/v1/products/:productId (Edit)
   //
   describe("PUT /api/v1/products/:productId", () => {
     it("it should receive a token error", done => {
       chai.request(server)
         .put("/api/v1/products/" + productId)
         .send(editProductParams)
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

      it("it should receive an updated product information", done => {
       chai.request(server)
          .put("/api/v1/products/" + productId)
          .set("Authorization", "Token " + apiToken)
          .send(editProductParams)
          .end((err, res) => {
              res.should.have.status(201);
              res.body.should.have.property("status");
              res.body.status.should.be.equal(201);
              res.body.should.have.property("message");
              res.body.should.have.property("statusMessage");
              res.body.statusMessage.should.be.equal("updated");

              res.body.should.have.property("product");
              res.body.product.should.not.be.null;
              res.body.product.should.have.property("id");
              res.body.product.id.should.not.be.null;
              res.body.product.should.have.property("code");
              res.body.product.code.should.not.be.null;
              res.body.product.should.have.property("name");
              res.body.product.name.should.not.be.null;
              res.body.product.should.have.property("price");
              res.body.product.price.should.not.be.null;
              res.body.product.should.have.property("priceWithVat");
              res.body.product.priceWithVat.should.not.be.null;
              res.body.product.should.have.property("photo");
              res.body.product.should.have.property("updatedAt");
              res.body.product.updatedAt.should.not.be.null;
              res.body.product.should.have.property("createdAt");
              res.body.product.createdAt.should.not.be.null;
              done();
           });
      });

      it("it should receive an error - empty product name", done => {
         chai.request(server)
         .put("/api/v1/products/" + productId)
         .set("Authorization", "Token " + apiToken)
         .send(emptyNameProductParams)
         .end((err, res) => {
           res.should.have.status(422);
           res.body.should.have.property("status");
           res.body.status.should.be.equal(422);
           res.body.should.have.property("message");
           res.body.should.have.property("statusMessage");
           res.body.statusMessage.should.be.equal("error");

           res.body.should.have.property("errors");
           res.body.errors.should.not.be.null;
           res.body.errors.should.have.property("name");
           res.body.errors.name.should.equal(errorMessageBlankField);
           done();
        });
      });
    });

    //
    // Test - POST /api/v1/:productId/photo (Add / Update)
    //
    describe("POST /api/v1/:productId/photo", () => {
      it("it should receive a token error", done => {
        chai.request(server)
          .post("/api/v1/products/" + productId + "/photo")
          .attach("photo",
          readFileSync("./seed/photos/products/product01.jpg"), "photo.jpg")
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

      it("it should receive the result after add or update photo", done => {
        chai.request(server)
          .post("/api/v1/products/" + productId + "/photo")
          .set("Authorization", "Token " + apiToken)
          .attach("photo",
          readFileSync("./seed/photos/products/product01.jpg"), "photo.jpg")
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property("status");
            res.body.status.should.be.equal(201);
            res.body.should.have.property("message");
            res.body.should.have.property("statusMessage");
            res.body.statusMessage.should.be.equal("updated");

            res.body.should.have.property("product");
            res.body.product.should.not.be.null;
            res.body.product.should.have.property("id");
            res.body.product.id.should.not.be.null;
            res.body.product.should.have.property("code");
            res.body.product.code.should.not.be.null;
            res.body.product.should.have.property("name");
            res.body.product.name.should.not.be.null;
            res.body.product.should.have.property("price");
            res.body.product.price.should.not.be.null;
            res.body.product.should.have.property("priceWithVat");
            res.body.product.priceWithVat.should.not.be.null;
            res.body.product.should.have.property("photo");;
            res.body.product.should.have.property("updatedAt");
            res.body.product.updatedAt.should.not.be.null;
            res.body.product.should.have.property("createdAt");
            res.body.product.createdAt.should.not.be.null;
            done();
           });
       });
     });

     //
     // Test - GET /api/v1/:productId/photo (Show)
     //
     describe("GET /api/v1/:productId/photo", () => {
       it("it should receive a token error", done => {
         chai.request(server)
           .get("/api/v1/products/" + productId + "/photo")
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

       it("it should receive a product photo", done => {
         chai.request(server)
           .get("/api/v1/products/" + productId + "/photo")
           .set("Authorization", "Token " + apiToken)
           .end((err, res) => {
             res.should.have.status(200);
             done();
            });
        });
      });

      //
      // Test - DELETE /api/v1/:productId/photo (Delete)
      //
      describe("DELETE /api/v1/:productId/photo", () => {
        it("it should receive a token error", done => {
          chai.request(server)
            .delete("/api/v1/products/" + productId + "/photo")
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

        it("it should receive a product information without photo", done => {
          chai.request(server)
            .delete("/api/v1/products/" + productId + "/photo")
            .set("Authorization", "Token " + apiToken)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.have.property("status");
              res.body.status.should.be.equal(200);
              res.body.should.have.property("message");
              res.body.should.have.property("statusMessage");
              res.body.statusMessage.should.be.equal("updated");

              res.body.should.have.property("product");
              res.body.product.should.not.be.null;
              res.body.product.should.have.property("id");
              res.body.product.id.should.not.be.null;
              res.body.product.should.have.property("code");
              res.body.product.code.should.not.be.null;
              res.body.product.should.have.property("name");
              res.body.product.name.should.not.be.null;
              res.body.product.should.have.property("price");
              res.body.product.price.should.not.be.null;
              res.body.product.should.have.property("priceWithVat");
              res.body.product.priceWithVat.should.not.be.null;
              res.body.product.should.have.property("photo");
              res.body.product.photo.should.be.eq("");
              res.body.product.should.have.property("updatedAt");
              res.body.product.updatedAt.should.not.be.null;
              res.body.product.should.have.property("createdAt");
              res.body.product.createdAt.should.not.be.null;
              done();
             });
         });

         it("it should receive a not found error status", done => {
           chai.request(server)
             .get("/api/v1/products/" + productId + "/photo")
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
       // Test - DELETE /api/v1/:productId (Delete)
       //
       describe("DELETE /api/v1/:productId", () => {
         it("it should receive a token error", done => {
           chai.request(server)
             .delete("/api/v1/products/" + productId)
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

         it("it should delete a product", done => {
           chai.request(server)
             .delete("/api/v1/products/" + productId)
             .set("Authorization", "Token " + apiToken)
             .end((err, res) => {
               res.should.have.status(204);
               done();
              });
          });

         it("it should receive a not found error status", done => {
            chai.request(server)
              .get("/api/v1/products/" + productId)
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
