import mongoose from "mongoose";
const { Schema } = mongoose;

const bookSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  isbn: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  images: [
    {
      filename: String,
      path: String,
    },
  ],
  seller: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
  buyer: {
    type: mongoose.Types.ObjectId,
    ref: "User",
  },
});

const Book = mongoose.model("Book", bookSchema);
export default Book;
