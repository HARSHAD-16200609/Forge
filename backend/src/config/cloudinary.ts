import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import { env } from "./env"

export type rType = "raw" | "image" | "video" | "auto"

let isConfigured = false;
export const uploadOnCloudinary = async (filepath: string, resourceType: rType) => {
    if (!isConfigured) {
        cloudinary.config({
            cloud_name: env.CLOUDINARY_CLOUD_NAME,
            api_key: env.CLOUDINARY_API_KEY,
            api_secret: env.CLOUDINARY_API_SECRET,
        })
        isConfigured = true
    }
    try {


        const result = await cloudinary.uploader.upload(filepath, { resource_type: resourceType })

        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath)
        }

        return result
    }
    catch (err) {
        console.dir(err, { depth: null });


        if (fs.existsSync(filepath)) {
            await fs.unlink(filepath, (err) => {
                if (err) throw err;
                console.log('path/file.txt was deleted')
            });
        }
        throw err;
    }

}


export const deleteFromCloudinary = async (publicId: string, resource_type: rType) => {

    if (!isConfigured) {
        cloudinary.config({
            cloud_name: env.CLOUDINARY_CLOUD_NAME,
            api_key: env.CLOUDINARY_API_KEY,
            api_secret: env.CLOUDINARY_API_SECRET,
        })
        isConfigured = true;
    }


    try {

      return  await cloudinary.uploader.destroy(publicId, { resource_type })


    } catch (error) {
        throw new Error("Failed to delete Attachment")

    }

}
