// UNIX時間を通常の "yyyymmdd hh:mm:ss"フォーマットの文字列に変換
const unix2datetime = (unixtime) => { // eslint-disable-line no-unused-vars
  const date = new Date(unixtime * 1000);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = (date.getHours() < 10) ? `0${date.getHours()}` : date.getHours();
  const min = (date.getMinutes() < 10) ? `0${date.getMinutes()}` : date.getMinutes();
  const sec = (date.getSeconds() < 10) ? `0${date.getSeconds()}` : date.getSeconds();
  return `${year}-${month}-${day} ${hour}:${min}:${sec}`;
};

// 現在のUNIX時刻を取得（単位：秒）
const getCurrentUnixTime = () => { // eslint-disable-line no-unused-vars
  const date = new Date();
  return Math.floor(date.getTime() / 1000);
};
