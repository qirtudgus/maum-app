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
