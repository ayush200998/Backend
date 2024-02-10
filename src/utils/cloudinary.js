/* eslint-disable max-len */
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

// Connect to Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const CloudinaryHelper = {};

// localFilePath: is a file path which is already uploaded in the server
CloudinaryHelper.uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload file to cloudinary
    const response = await cloudinary.v2.uploader
      .upload(localFilePath, {
        resource_type: 'auto',
      });

    // Successfully uploaded
    console.log('File uploaded sucessfully:', response.url);
    return response;
  } catch (error) {
    fs.unlinkFile(localFilePath);
    return null;
  }
};

// TODO: Add a handler for uploading a file with cloudinary streams
CloudinaryHelper.uploadOnCloudinaryWithStreams = async (localFilePath) => {
  try {
    const byteArrayBuffer = fs.readFileSync(localFilePath);
    const uploadedResult = await new Promise((resolve) => {
      cloudinary.v2.uploader.upload_stream((error, uploadResult) => resolve(uploadResult)).end(byteArrayBuffer);
    });
    console.log('Uploaded result', uploadedResult);
    return uploadedResult;
  } catch (error) {
    fs.unlinkFile(localFilePath);
    return null;
  }
};

export default CloudinaryHelper;
