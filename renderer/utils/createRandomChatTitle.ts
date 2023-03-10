const 접두어 = [
  '용감한',
  '어리석은',
  '배고픈',
  '팔이 짧은',
  '꿈을 꾸는',
  '방금 달려온',
  '공부 잘하는',
  '향이 좋은',
  '유쾌한',
  '보고싶은',
];

const 접미어 = [
  '오징어들',
  '호랑이들',
  '천재들',
  '바보들',
  '외계인들',
  '개발자들',
  '회사원들',
  '다람쥐들',
  '강아지들',
  '코끼리들',
];

/**
 * 그룹 채팅 생성 시 input에 랜덤으로 들어가는 문자열을 생성합니다.
 */
export const RandomTitle = () => {
  return 접두어[Math.floor(Math.random() * 10)] + ' ' + 접미어[Math.floor(Math.random() * 10)];
};
