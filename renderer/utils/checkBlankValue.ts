/**
 * 매개변수가 공백으로만 이루어져있는지 체크합니다.
 * @param value 공백이 있는지 검사할 string
 * @returns
 */
export const checkBlankValue = (value: string) => {
  const blank_pattern = /^\s+\s+$/g;
  if (value === ' ' || value.length === 0 || blank_pattern.test(value)) {
    return true;
  } else {
    return false;
  }
};
