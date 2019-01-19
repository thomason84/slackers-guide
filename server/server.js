var express = require("express");
const hbs = require("hbs");
const fs = require("fs");
var bodyParser = require("body-parser");
var { ObjectID } = require("mongodb");

var { mongoose } = require("./db/mongoose");
var { Park } = require("./models/park");

var app = express();
const port = process.env.PORT || 3000;

hbs.registerPartials(__dirname + "/views/partials");
app.set("view engine", "hbs");

app.use((req, res, next) => {
  var now = new Date().toString();
  var log = `${now}: ${req.method} ${req.url}`;
  console.log(log);
  fs.appendFile("server.log", log + "\n", err => {
    if (err) {
      console.log("unable to append to server.log.");
    }
  });
  next();
});

app.use("/static", express.static("static"));
app.use("/images", express.static("images"));

app.use(express.static(__dirname + "/public"));

hbs.registerHelper("getCurrentYear", () => {
  return new Date().getFullYear();
});

hbs.registerHelper("screamIt", text => {
  return text.toUpperCase();
});

app.get("/", (req, res) => {
  res.render("home.hbs", {
    canonical: "",
    title: "Slackers Guide to Charleston",
    pageTitle: "Slackers Guide to Charleston",
    metaDesc: "Your locals guide to Charleston",
    welcomeMessage: "Welcome to the Slackers Guide"
  });
});

app.get("/about", (req, res) => {
  res.render("about.hbs", {
    canonical: "",
    title: "About Me",
    pageTitle: "Web Developer, SEO Specialist, and Web Analyst experience",
    metaDesc: "Learn about the Slackers Guide.  ",
    welcomeMessage: "About The Slackers Guide"
  });
});

app.get("/contact", (req, res) => {
  res.render("contact.hbs", {
    canonical: "",
    title: "Contact Us",
    pageTitle: "Contact Slackers Guide",
    metaDesc:
      "Reach out to Slackers Guide to add additional parks, restauraunts, or any other local hole in the wall.",
    welcomeMessage: "Contact The Slacker Group"
  });
});

app.get("/bad", (req, res) => {
  res.send({
    errorMessage: "Unable to handle request"
  });
});

app.use(bodyParser.json());

//post to the parks collection
app.post("/parks", (req, res) => {
  var park = new Park({
    name: req.body.name,
    description: req.body.description,
    visited: req.body.visited
  });

  park.save().then(
    doc => {
      res.send(doc);
    },
    e => {
      res.status(400).send(e);
    }
  );
});

//get all parks from the parks collection
app.get("/parks", (req, res) => {
  Park.find().then(
    parks => {
      res.send({ parks });
    },
    e => {
      res.status(400).send(e);
    }
  );
});

//get one park from parks/id number
app.get("/parks/:id", (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Park.findById(id)
    .then(park => {
      if (!park) {
        return res.status(404).send();
      }

      res.send({ park });
    })
    .catch(e => {
      res.status(400).send();
    });
});

//delete park by id from parks/id number
app.delete("/parks/:id", (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Park.findByIdAndRemove(id)
    .then(park => {
      if (!park) {
        return res.status(404).send();
      }

      res.send({ park });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = { app };
