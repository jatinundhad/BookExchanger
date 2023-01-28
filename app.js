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
import multer from "multer";
import { storage_user, storage_book, cloudinary } from "./cloudinary/index.js";
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

app.get(
  "/profile/:id",
  AsyncCatch(async (req, res) => {
    const { id } = req.params;
    const foundUser = await User.findById(id)
      .populate("sellBooks")
      .populate("buyBooks");

    res.render("./User/profile", {
      profile: foundUser,
      address: foundUser.address,
      sellBooks: foundUser.sellBooks,
      buyBooks: foundUser.buyBooks,
      search: false,
    });
  })
);

const upload = multer({ storage: storage_user });
app.put(
  "/upload/:id",
  upload.single("profile"),
  AsyncCatch(async (req, res, next) => {
    const { id } = req.params;
    const foundUser = await User.findById(id);
    if (foundUser.avatar.filename !== "Profile_Photo.jpg") {
      await cloudinary.uploader.destroy(foundUser.avatar.filename);
    }
    foundUser.avatar = { url: req.file.path, filename: req.file.filename };
    await foundUser.save();
    req.flash(
      "success",
      `${foundUser.username}, Your Avatar has been changed Successfully!!!`
    );
    res.redirect(`/profile/${id}`);
  })
);

app.put(
  "/profile/:id",
  AsyncCatch(async (req, res) => {
    const { id } = req.params;
    const { user } = req.body;
    const foundUser = await User.findById(id);
    foundUser.name.firstName = user.firstName;
    foundUser.name.lastName = user.lastName;
    foundUser.phoneNo = user.phoneno;
    foundUser.profileCompleted = true;
    foundUser.address = {
      houseNo: user.houseno,
      street: user.street,
      landmark: user.landmark,
      city: user.city,
      country: user.country,
      pinCode: user.pincode,
    };

    const updatedProfile = await foundUser.save();
    req.flash(
      "success",
      `${updatedProfile.username}, Your Profile is Ready!!!`
    );
    res.redirect(`/profile/${id}`);
  })
);

app.get("/login", (req, res) => {
  res.render("./User/login", { search: false });
});

app.get("/register", (req, res) => {
  res.render("./User/signup", { search: false });
});

app.get("/about", (req, res) => {
  res.render("./about.ejs", { search: false });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  AsyncCatch((req, res) => {
    req.flash("success", `Welcome again, ${req.session.passport.user}`);
    res.redirect("/home");
  })
);

app.post(
  "/signup",
  AsyncCatch(async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const user = new User({ username: username, email: email });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", `Welcome ${registeredUser.username}`);
        res.redirect("/home");
      });
    } catch (e) {
      req.flash("error", e.message);
      return res.redirect("/register");
    }
  })
);

app.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "See you soon!!!");
    res.redirect("/home");
  });
});

app.get("/sellbook", (req, res) => {
  res.render("Book/sellbook", { search: false });
});

const uploadBookImage = multer({ storage: storage_book });
app.post(
  "/sellbook/:id",
  uploadBookImage.array("bookPhotos"),
  AsyncCatch(async (req, res, next) => {
    const { id } = req.params;
    const foundUser = await User.findById(id);

    const newBook = new Book(req.body.book);
    newBook.images = req.files.map((book) => ({
      filename: book.filename,
      path: book.path,
    }));
    newBook.seller = foundUser;
    foundUser.sellBooks.push(newBook);

    await foundUser.save();
    await newBook.save();

    res.redirect("/home");
  })
);

app.get(
  "/book/:id",
  AsyncCatch(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id).populate("seller");
    const seller = book.seller;
    res.render("Book/book", {
      book,
      profile: seller,
      address: seller.address,
      search: false,
    });
  })
);

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

app.listen(2000);
