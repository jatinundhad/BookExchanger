import { Router } from "express";
const router = Router();
import AsyncCatch from "../utils/AsyncCatch.js";
import Book from "../models/Book.js";
import multer from "multer";
import { cloudinary, storage_book } from "../cloudinary/index.js";
import User from "../models/User.js";
import { isLoggedIn, isSameUser } from "../middlewares.js";

router.get("/sellbook", isLoggedIn, (req, res) => {
  res.render("Book/sellbook", { search: false });
});

const uploadBookImage = multer({ storage: storage_book });
router.post(
  "/sellbook/:id",
  isLoggedIn,
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

    res.redirect("/");
  })
);

router.get(
  "/book/:id",
  AsyncCatch(async (req, res, next) => {
    const { id } = req.params;
    const book = await Book.findById(id).populate("seller").populate("buyer");
    const seller = book.seller;
    const buyer = book.buyer;
    res.render("Book/book", {
      book,
      profile: seller,
      buyer: buyer,
      address: seller.address,
      search: false,
    });
  })
);

router.delete(
  "/book/:book_id/user/:user_id",
  isLoggedIn,
  AsyncCatch(async (req, res, next) => {
    const { book_id, user_id } = req.params;
    const book = await Book.findByIdAndDelete(book_id);
    for (let image of book.images) {
      await cloudinary.uploader.destroy(image.filename);
    }
    await User.findByIdAndUpdate(user_id, { $pull: { sellBooks: book_id } });
    req.flash("success", "Book has been deleted from sell Successfully!!!");
    res.redirect("/");
  })
);

router.put(
  "/buybook/:book_id/buyer/:buyer_id",
  isLoggedIn,
  isSameUser,
  AsyncCatch(async (req, res, next) => {
    const { book_id, buyer_id } = req.params;
    const book = await Book.findById(book_id);
    const buyer = await User.findById(buyer_id);
    book.buyer = buyer;
    buyer.buyBooks.push(book);
    await buyer.save();
    await book.save();
    req.flash("success", "You booked this book!!!");
    res.redirect(`/book/${book_id}`);
  })
);

export default router;
