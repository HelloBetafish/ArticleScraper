var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var request = require("request");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect("mongodb://localhost/SKTest4", {
  useMongoClient: true
});

// Routes
// Index Home Page which is also the login page
app.get("/", function(req, res) {
  // refers to .handlebars file that will be inserted into main.handlebars.
  db.Article
    .find({})
    .then(function(dbArticle) {

      var hbsObject = {
        articles: dbArticle
      };
      console.log(hbsObject);

      res.render("index", hbsObject);
      // res.json(dbArticle);
    .catch(function(err) {
      res.json(err);
    });
});

// A GET route for scraping the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://smittenkitchen.com/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    // Now, we grab every h2 within an article tag, and do the following:
    $("main article").each(function(i, element) {
      // Save an empty result object
      var result = {};

      var string = $(this)
        .find("div.entry-summary")
        .text().trim();
      var length = 300;
      var trimmedString = string.substring(0, length);

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .find("h1.entry-title a")
        .text();
      result.link = $(this)
        .find("h1.entry-title a")
        .attr("href");
      result.summary = trimmedString;
      result.image = $(this)
        .find("a.smittenkitchen-thumbnail img")
        .attr("src");
      // Create a new Article using the `result` object built from scraping
      db.Article
        .create(result)
        .then(function(dbArticle) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Complete");
          console.log(result);
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article
    .find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  db.Article
    .findOne({ _id: req.params.id})
    .populate("comments")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "comment",
  // then responds with the article with the comment included
});

app.get("/comments", function(req, res) {
  // Find all Comments
  db.Comment
    .find({})
    .then(function(dbComment) {
      // If all Comments are successfully found, send them back to the client
      res.json(dbComment);
    })
    .catch(function(err) {
      // If an error occurs, send the error back to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Comment
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Create a new comment and pass the req.body to the entry
  // save the new note that gets posted to the Notes collection
  db.Comment
  .create(req.body)
  .then(function(dbComment) {
      // then find an article from the req.params.id
  // then push the new Comment's _id to the User's `comments` array
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    // If a Comment was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Comment
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { comments: dbCommentCommnet._id } }, { new: true });
  })
  .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});