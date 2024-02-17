/* eslint-disable import/extensions */
/* eslint-disable consistent-return */
import User from '../models/user.models.js';
import APIErrors from '../utils/ApiErrors.js';
import ValidationUtils from '../utils/validation_utils.js';

const UserHelper = {};

UserHelper.validateFormData = (fields) => {
  const isPassingEmptyValuesValidation = ValidationUtils.validateForEmptyValues(fields);

  if (!isPassingEmptyValuesValidation) {
    throw new APIErrors(400, 'All fields are required');
  }
  return isPassingEmptyValuesValidation;
};

UserHelper.generateAccessAndRefreshTokens = async (userId = '') => {
  if (!userId) {
    throw new APIErrors(401, 'No user id found');
  }

  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessTokens();
    const refreshToken = user.generateRefreshTokens();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    throw new APIErrors(500, 'Something went wrong while generaing access and refresh token');
  }
};

UserHelper.getCookieOptions = () => {
  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };

  return cookieOptions;
};

export default UserHelper;
