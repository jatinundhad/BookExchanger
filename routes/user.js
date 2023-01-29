import * as dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { Router } from "express";
const router = Router();
import User from "../models/User.js";
import AsyncCatch from "../utils/AsyncCatch.js";
import multer from "multer";
import { storage_user } from "../cloudinary/index.js";
import passport from "passport";
import { isLoggedIn } from "../middlewares.js";

router.get("/login", (req, res) => {
  res.render("./User/login", { search: false });
});

router.get("/register", (req, res) => {
  res.render("./User/signup", { search: false });
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  AsyncCatch((req, res) => {
    req.flash("success", `Welcome again, ${req.session.passport.user}`);
    res.redirect("/");
  })
);

router.post(
  "/signup",
  AsyncCatch(async (req, res, next) => {
    try {
      const { username, email, password } = req.body;
      const user = new User({ username: username, email: email });
      const registeredUser = await User.register(user, password);
      req.login(registeredUser, (err) => {
        if (err) return next(err);
        req.flash("success", `Welcome ${registeredUser.username}`);
        res.redirect("/");
      });
    } catch (e) {
      req.flash("error", e.message);
      return res.redirect("/register");
    }
  })
);

router.post("/logout", isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success", "See you soon!!!");
    res.redirect("/");
  });
});

router.get(
  "/profile/:id",
  isLoggedIn,
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
router.put(
  "/upload/:id",
  isLoggedIn,
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

router.put(
  "/profile/:id",
  isLoggedIn,
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

export default router;
