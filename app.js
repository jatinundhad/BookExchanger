import * as dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import engine from "ejs-mate";
import session from "express-session";
import cookieParser from "cookie-parser";
import passport from "passport";
import User from "./models/User.js";
import mongoose from "mongoose";
import flash from "connect-flash";
import ExpressError from "./utils/ExpressError.js";
import AsyncCatch from "./utils/AsyncCatch.js";
import methodOverride from "method-override";
import Book from "./models/Book.js";

const app = express();

// configuring view engine, static resources
const __dirname = dirname(fileURLToPath(import.meta.url));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", engine);
app.use(flash());
app.use(methodOverride("_method"));

// for parsing incoming data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.set("strictQuery", true);

// configuring the mongodb database
const dburl = process.env.DB_URL || "mongodb://localhost:27017/book-exchanger";
mongoose
  .connect(dburl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected with database");
  })
  .catch((error) => {
    console.log("Error while connecting with database");
    console.log("Error >> ", error);
  });

// setting the session
const sessionSecret = process.env.SESSION_SECRET || "thisissomethingsecret";
app.use(cookieParser());
const oneDay = 1000 * 60 * 60 * 24;
app.use(
  session({
    secret: sessionSecret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false,
  })
);

// configuring the passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// configuring the bootstrap
app.use(
  "/css",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/css"))
);

app.use(
  "/js",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist/js"))
);

app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// routes
app.get(
  "/home",
  AsyncCatch(async (req, res) => {
    const books = await Book.find({});
    res.render("./Home/home", { books: books, search: true });
  })
);

app.get("/about", (req, res) => {
  res.render("./about.ejs", { search: false });
});

// user routes
import userRoutes from "./routes/user.js";
app.use("/", userRoutes);

// book routes
import bookRoutes from "./routes/book.js";
app.use("/", bookRoutes);

// show the page not found message for not existing route
app.all("*", (req, res, next) => {
  next(new ExpressError("Page not found", 404));
});

// will render the error (error middleware)
app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Something Went Wrong!!!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port);
