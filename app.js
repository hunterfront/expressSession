const express = require("express");
const session = require("express-session");
const escapeHtml = require("escape-html");
const app = express();
let RedisStore = require("connect-redis")(session);
const { createClient } = require("redis");
let redisClient = createClient({ legacyMode: true });
redisClient.connect().catch(console.error);

const cors = require("cors");
// var corsOptions = {
//   origin: 'http://127.0.0.1:8001',
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
//   // credentials: true,
// };
app.use(cors());

app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: "keyboard cat",
    resave: false,
    rolling: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 * 24 },
  })
);

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    next("route");
  }
}

app.get("/", isAuthenticated, function (req, res) {
  res.send(
    "hello, " +
      escapeHtml(req.session.user) +
      "!" +
      ' <a href="/logout">Logout</a>'
  );
});
app.get("/", function (req, res) {
  res.send(
    '<form action="/login" method="post">' +
      'Username: <input name="user"><br>' +
      'Password: <input name="pass" type="password"><br>' +
      '<input type="submit" text="Login"></form>'
  );
});

app.post(
  "/login",
  express.urlencoded({ extended: false }),
  function (req, res) {
    // login logic to validate req.body.user and req.body.pass
    // would be implemented here. for this example any combo works

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err);

      // store user information in session, typically a user id
      req.session.user = req.body.user;

      // save the session before redirection to ensure page
      // load does not happen before session is saved
      req.session.save(function (err) {
        if (err) return next(err);
        res.redirect("/");
      });
    });
  }
);

app.get("/logout", function (req, res, next) {
  // logout logic

  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.user = null;
  req.session.save(function (err) {
    if (err) next(err);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err);
      res.redirect("/");
    });
  });
});

app.get("/csrf", function (req, res) {
  console.log("csrf attack!!");
  console.log(req.session);
  res.send("hello csrf");
});

app.listen(80, function () {
  console.log("listen on 80");
});
