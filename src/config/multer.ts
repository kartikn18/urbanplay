import cloudinary from "../config/cloudinary";
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'adminImages', 
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif','image']
    },
});

const upload = multer({ storage });

export default upload;