
const CustomError = require('./CustomError'),
    InvalidStatusCodeError = CustomError('InvalidStatusCodeError'),
    InvalidJSONError = CustomError('InvalidJSONError');

module.exports = {InvalidStatusCodeError, InvalidJSONError};
