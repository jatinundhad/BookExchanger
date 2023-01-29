import Book from "./models/Book.js";
import AsyncCatch from "./utils/AsyncCatch.js";
import User from "./models/User.js";

const isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.flash("error", "You must required login");
    return res.redirect("/login");
  }
  next();
};

const isSameUser = AsyncCatch(async (req, res, next) => {
  const { book_id, buyer_id } = req.params;
  const book = await Book.findById(book_id).populate("seller");
  const currentUser = await User.findById(buyer_id);

  if (!currentUser.profileCompleted) {
    req.flash("error", "Please Complete your profile first.");
    return res.redirect(`/book/${book_id}`);
  }
  if (buyer_id.toString() === book.seller._id.toString()) {
    req.flash("error", "You cannot buy this book");
    return res.redirect(`/book/${book_id}`);
  }
  next();
});

export { isLoggedIn, isSameUser };
