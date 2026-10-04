import multer from "multer"
import path from "path"
import { BadRequestError } from "../utility/errorHandling/customErrors";
import { MIME_TO_RESOURCE_TYPE } from "../db/message.schema"
import { AVATAR_MAX_BYTES, AVATAR_MIME_TYPES } from "../db/auth-schema"

const normalizeMimeType = (mimetype?: string) => {
    const raw = (mimetype ?? "").trim().toLowerCase();
    const index = raw.indexOf(";");
    return index === -1 ? raw : raw.slice(0, index).trim();
};

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
        const mimetype = normalizeMimeType(file.mimetype);
        if (!MIME_TO_RESOURCE_TYPE.has(mimetype)) {
            return cb(new BadRequestError("Unsupported file type"));
        }

        file.mimetype = mimetype;
        cb(null, true);
    },
});



export default upload;

const avatarMimeTypes = new Set<string>(AVATAR_MIME_TYPES);

/** Single image, image types only, 5MB. Rejects SVG so a hostile upload can never be scripted. */
export const avatarUpload = multer({
    storage,
    limits: {
        fileSize: AVATAR_MAX_BYTES,
        files: 1,
    },
    fileFilter(req, file, cb) {
        const mimetype = normalizeMimeType(file.mimetype);
        if (!avatarMimeTypes.has(mimetype)) {
            return cb(new BadRequestError("Avatar must be a JPEG, PNG, WebP or GIF image"));
        }

        file.mimetype = mimetype;
        cb(null, true);
    },
});