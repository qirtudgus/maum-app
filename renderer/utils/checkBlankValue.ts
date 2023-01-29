//인자가 공백으로만 이루어져있는지 체크합니다.
//메시지인풋, 채팅제목인풋에 사용중

export const checkBlankValue = (value: string) => {
  const blank_pattern = /^\s+\s+$/g;
  if (value === ' ' || value.length === 0 || blank_pattern.test(value)) {
    return true;
  } else {
    return false;
  }
};
