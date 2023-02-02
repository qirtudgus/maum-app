/**
 * firebase timeStamp로 생성한 seconds를 날짜형식으로 반환해주는 함수입니다.
 * @param time 초로 계산된 number를 사용합니다.
 * @returns  1675337799 => "23. 02. 02. 오후 08:36"
 */
export function convertDate(time: number) {
  let dateInMillis = time * 1000;
  let date = new Date(dateInMillis);
  let myDate = date.toLocaleDateString([], {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  });
  let myTime = date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  return myDate + ' ' + myTime;
}
