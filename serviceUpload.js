import multer from "multer";
import path from "path";

const serviceStorage = multer.diskStorage({
    destination: path.join("../src/images/services"),
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

export const serviceUpload = multer({
    storage: serviceStorage,
    limits: { fileSize: 3000000 },
}).single("serviceImg");