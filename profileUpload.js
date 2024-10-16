import multer from "multer";
import path from "path";

const profileStorage = multer.diskStorage({
    destination: path.join("./images"),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

export const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 3000000 },
}).single("file");