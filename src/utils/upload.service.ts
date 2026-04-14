import cloudinary from "../config/cloudinary";
import { UploadApiResponse } from "cloudinary";

export const uploadimage = async (filebuffer: Buffer, folder: string): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder  }, (error, result) => {
            if (error) {
                reject(error);
            } else {
                resolve(result!); 
            }
        }).end(filebuffer);
    });
};