require("./config/config");

const _ = require("lodash");
const express = require("express");
const hbs = require("hbs");
const fs = require("fs");
const bodyParser = require("body-parser");
const { ObjectID } = require("mongodb");

const { mongoose } = require("./db/mongoose");
const { Park } = require("./models/park");
const { User } = require("./models/user");
const { authenticate } = require("./middleware/authenticate");

const app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

const path = require("path");
hbs.registerPartials(path.join(__dirname, "../", "/views/partials"));
app.use(express.static(path.join(__dirname, "../", "/public")));
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

//get all visited parks
app.get("/visitedParks", (req, res) => {
  Park.find({ visited: true }).then(
    docs => {
      res.render("parks", {
        parks: docs
      });
    },
    e => {
      res.status(400).send(e);
    }
  );
});

//get all parks from the parks collection
app.get("/allParks", (req, res) => {
  Park.find({}).then(
    docs => {
      res.render("parks", {
        parks: docs
      });
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
    .then(parks => {
      if (!parks) {
        return res.status(404).send();
      }
      res.render("parkDetail", {
        parks: parks
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

//delete park by id from parks/id number
app.delete("/parks/:id", authenticate, (req, res) => {
  var id = req.params.id;

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  Park.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  })
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

//Patch method to update todos by specified keys only
app.patch("/parks/:id", authenticate, (req, res) => {
  var id = req.params.id;
  var body = _.pick(req.body, ["visited", "description", "location"]);

  if (!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  if (_.isBoolean(body.completed) && body.completed) {
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  Park.findOneAndUpdate(
    { _id: id, _creator: req.user._id },
    { $set: body },
    { new: true }
  )
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

app.post("/users", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);
  var user = new User(body);

  user
    .save()
    .then(() => {
      return user.generateAuthToken();
    })
    .then(token => {
      res.header("x-auth", token).send(user);
    })
    .catch(e => {
      res.status(400).send(e);
    });
});

app.get("/users/me", authenticate, (req, res) => {
  res.send(req.user);
});

app.post("/users/login", (req, res) => {
  var body = _.pick(req.body, ["email", "password"]);

  User.findByCredentials(body.email, body.password)
    .then(user => {
      return user.generateAuthToken().then(token => {
        res.header("x-auth", token).send(user);
      });
    })
    .catch(e => {
      res.status(400).send();
    });
});

app.delete("/users/me/token", authenticate, (req, res) => {
  req.user.removeToken(req.token).then(
    () => {
      res.status(200).send();
    },
    () => {
      res.status(400).send();
    }
  );
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = { app };
