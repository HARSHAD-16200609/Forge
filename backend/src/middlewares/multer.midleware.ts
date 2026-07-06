import multer from "multer"
import path from "path"
import { BadRequestError } from "../utility/errorHandling/customErrors";
import { MIME_TO_RESOURCE_TYPE } from "../db/message.schema"

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, path.join(process.cwd(), "public", "temp"));
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
    },
});


export const upload = multer({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024,
        files: 10,
    },
    fileFilter(req, file, cb) {
        if (!MIME_TO_RESOURCE_TYPE.get(file.mimetype)) {
            return cb(new BadRequestError("Unsupported file type"));
        }

        cb(null, true);
    },
});



export default upload;