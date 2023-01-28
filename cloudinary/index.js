import * as dotenv from "dotenv";
if (process.env.NODE_ENV !== "production") {
  dotenv.config();
}

import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage_user = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "BookExchange_users",
    allowedFormats: ["jpeg", "jpg", "png"],
  },
});

const storage_book = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "BookExchange_books",
    allowedFormats: ["jpeg", "jpg", "png"],
  },
});

export { cloudinary, storage_user, storage_book };
