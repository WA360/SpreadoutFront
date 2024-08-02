export const PASSWORD_MIN_LENGTH = 1;
// export const PASSWORD_REGEX = new RegExp(
//   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*?[#?!@$%^&*-]).+$/
// );
export const PASSWORD_REGEX = new RegExp(/.*/);
export const PASSWORD_REGEX_ERROR =
  '비밀번호는 소문자, 대문자, 숫자 및 특수 문자를 포함해야 합니다.';
