/* eslint-disable import/extensions */
/* eslint-disable consistent-return */
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

export default UserHelper;
