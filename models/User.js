import mongoose from "mongoose";
const { Schema } = mongoose;
import passportLocalMongoose from "passport-local-mongoose";

const userSchema = new Schema({
  profileCompleted: {
    type: Boolean,
    default: false,
  },
  username: {
    type: String,
    required: true,
  },
  name: {
    firstName: String,
    lastName: String,
  },
  email: {
    type: String,
    required: true,
  },
  phoneNo: {
    type: String,
  },
  address: {
    houseNo: Number,
    street: String,
    landmark: String,
    city: String,
    country: String,
    pinCode: Number,
  },
  avatar: {
    url: {
      type: String,
      default: "/images/Profile_Photo.jpg",
    },
    filename: {
      type: String,
      default: "Profile_Photo.jpg",
    },
  },
  sellBooks: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Book",
    },
  ],
  buyBooks: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Book",
    },
  ],
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);
export default User;
