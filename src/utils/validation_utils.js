const ValidationUtils = {};

ValidationUtils.validateForEmptyValues = (fields = []) => {
  if (fields?.length <= 0) {
    return true;
  }

  if (fields.some((field) => field?.trim() === '')) {
    return false;
  }

  return true;
};

export default ValidationUtils;
