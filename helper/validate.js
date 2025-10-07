import Validator from "validatorjs";

/**
 * A function to validate a given object based on the given rules.
 *
 * @param {object} body - The object to be validated.
 * @param {object} rules - The validation rules.
 * @param {object} customMessages - The custom error messages.
 * @param {function} callback - The callback function to be executed after validation.
 *
 * @example
 * const body = {
 *  name: 'John Doe',
 *  email: 'john.doe@example.com',
 * };
 *
 * const rules = {
 *  name: 'required',
 *  email: 'required|email',
 * };
 *
 * const customMessages = {
 *  'name.required': 'Name is required',
 * };
 *
 * validator(body, rules, customMessages, (err, status) => {
 *  if (err) {
 *    console.log(err);
 *  } else {
 *    console.log(status);
 *  }
 * });
 */
const validator = (body, rules, customMessages, callback) => {
  const validation = new Validator(body, rules, customMessages);
  validation.passes(() => callback(null, true));
  validation.fails(() => callback(validation.errors, false));
};


export default validator;
