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
    const response = await cloudinary.uploader
      .upload(localFilePath, {
        resource_type: 'auto',
      });

    fs.unlinkSync(localFilePath);
    // Successfully uploaded
    return response;
  } catch (error) {
    console.log('Error while uploading on cloudinary', error.message);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// Uploading a file with cloudinary streams
CloudinaryHelper.uploadOnCloudinaryWithStreams = async (localFilePath) => {
  const uploadOptions = {
    resource_type: 'video',
    folder: 'videos',
  };

  try {
    const byteArrayBuffer = fs.readFileSync(localFilePath);
    const uploadedResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(uploadOptions, (error, uploadResult) => {
        if (error) {
          reject(error);
        } else {
          resolve(uploadResult);
        }
      }).end(byteArrayBuffer);
    });

    fs.unlinkSync(localFilePath);
    return uploadedResult;
  } catch (error) {
    console.log('Error while uploading on cloudinary with Streams', error.message);
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// Get the public id from cloudinary url
CloudinaryHelper.getPublicIdFromUrl = (url = '') => {
  const regex = /\/v\d+\/([^\/]+)\.\w+$/;
  const match = url.match(regex);

  if (match) {
    const publicId = match[1];
    return publicId;
  }
  return null;
};

// Delete a file from cloudinary
CloudinaryHelper.deleteFromCloudinary = async (url) => {
  const publicId = CloudinaryHelper.getPublicIdFromUrl(url);
  try {
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log('Error while deleting the file from cloudinary', {
      url,
      error: error?.message,
    });
    return null;
  }
};

export default CloudinaryHelper;
