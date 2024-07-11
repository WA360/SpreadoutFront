export const PASSWORD_MIN_LENGTH = 1;
// export const PASSWORD_REGEX = new RegExp(
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*?[#?!@$%^&*-]).+$/
// );
export const PASSWORD_REGEX = new RegExp(/.*/);
export const PASSWORD_REGEX_ERROR =
  'A password must have lowercase, UPPERCASE, a number and special characters.';
