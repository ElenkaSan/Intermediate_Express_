process.env.NODE_ENV = "test";
// const Book = require("../models/book");

const request = require("supertest");
const app = require("../app");
const db = require("../db");


let isbnB;
  
beforeEach(async () => {
    let result = await db.query(`
      INSERT INTO 
        books (isbn, amazon_url,author,language,pages,publisher,title,year)   
        VALUES(
          '5465898', 
          'https://amazon.com/star', 
          'Alla Poom', 
          'Russian', 
          345,  
          'Something', 
          'Not my life', 
          2020) 
        RETURNING isbn`);
  
    isbnB = result.rows[0].isbn
  });

describe("POST/books", function () {
    test("Posting book", async function () {
        let response = await request(app)
            .post(`/books`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew",
                "language": "english",
                "pages": 2643,
                "publisher": "University Press",
                "title": "Mathematics in Video Games",
                "year": 2017
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body).toEqual({
            "book": {
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew",
                "language": "english",
                "pages": 2643,
                "publisher": "University Press",
                "title": "Mathematics in Video Games",
                "year": 2017
            }
        });
    });

    test("Prevents creating book without required title", async function () {
        const response = await request(app)
            .post(`/books`)
            .send({language: "german"});
        expect(response.statusCode).toBe(400);
      });
      

    test("cannot post book", async function () {
        let response = await request(app)
            .post(`/books`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "pages": "264",
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            "error": {
                "message":[ 
                    "instance requires property \"language\"",
                ],
                "status": 400
            },
            "message":[ 
                "instance requires property \"language\"",
            ]
        });
    });

});

describe("GET/books", function () {
    test("Gets a list of one book", async function () {
      const response = await request(app).get(`/books`);
      const books = response.body.books;
      expect(books).toHaveLength(1);
      expect(books[0]).toHaveProperty("isbn");
      expect(books[0]).toHaveProperty("author");
    });
  });


  describe("GET/books/:isbn", function () {
    test("Responds with 404 if can't find book in question", async function () {
      const response = await request(app)
          .get(`/books/23`)
      expect(response.statusCode).toBe(404);
    });
  });
  
describe("PUT/books/:id", function () {
    test("can update book", async function () {
        let response = await request(app)
            .put(`/books/${isbnB}`)
            .send({
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Mat Lane",
                "language": "spanish",
                "pages": 300,
                "publisher": "Princeton University Press",
                "title": "Update",
                "year": 2017
            });

            expect(response.body.book).toHaveProperty("isbn");
            expect(response.body.book.title).toBe("Update");
    });

    test("cannot update book", async function () {
        let response = await request(app)
            .put(`/books/${isbnB}`)
            .send({
                "isbn": "0691161518",
                "amazon_url": "http://a.co/eobPtX2",
                "author": "Matthew Lane",
                "pages": "string",
                "publisher": "Princeton University Press",
                "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
                "year": 2017
            });
        expect(response.statusCode).toEqual(400);
        expect(response.body).toEqual({
            "error": {
                "message": "Not allowed",
                "status": 400
            },
            "message": "Not allowed"
        });
    });
    test("Responds 404 if can't find book in question", async function () {
        // delete book first
        await request(app)
            .delete(`/books/${isbnB}`)
        const response = await request(app).delete(`/books/${isbnB}`);
        expect(response.statusCode).toBe(404);
      });
});
  
describe("DELETE/books/:id", function () {
    test("Delete a book", async function () {
      const response = await request(app)
          .delete(`/books/${isbnB}`)
      expect(response.body).toEqual({message: "Book deleted"});
    });
  });
  

  afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });
  
  
  afterAll(async function () {
    await db.end()
  });
  