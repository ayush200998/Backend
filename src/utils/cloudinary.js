/* eslint-disable no-underscore-dangle */
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
CloudinaryHelper.uploadOnCloudinary = async (localFilePath, userDetails = null) => {
  try {
    if (!localFilePath) return null;

    const userId = userDetails?._id;

    // Upload file to cloudinary
    let response = null;
    if (userId) {
      response = await cloudinary.uploader
        .upload(localFilePath, {
          folder: userId,
          resource_type: 'auto',
        });
    } else {
      response = await cloudinary.uploader
        .upload(localFilePath, {
          resource_type: 'auto',
        });
    }

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
CloudinaryHelper.uploadOnCloudinaryWithStreams = async (localFilePath, userDetails = null) => {
  if (!localFilePath) return null;

  const userId = userDetails?._id;

  const uploadOptions = {
    resource_type: 'video',
    folder: userId ? `${userId}` : 'videos',
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
  const regex = /\/v\d+\/([^/]+)\.\w+$/;
  const match = url.match(regex);

  if (match) {
    const publicId = match[1];
    return publicId;
  }
  return null;
};

// Delete a file from cloudinary
CloudinaryHelper.deleteFromCloudinary = async (resource) => {
  const {
    url,
    // eslint-disable-next-line camelcase
    public_id,
    resourceType = null,
  } = resource;

  let response = null;
  try {
    // This means an image is being deleted
    if (!resourceType) {
      response = await cloudinary.uploader.destroy(public_id);
    } else {
      response = await cloudinary.uploader.destroy(public_id, {
        resource_type: resourceType,
      });
    }
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
