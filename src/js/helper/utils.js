const extractLocationFromString = (str) => {
  if (str.indexOf("(") < 0)
    return str.substring(0, str.indexOf("方") + 1);
  else
    return str.substring(str.indexOf("(") + 3, str.indexOf(")"));
};

/**
 * @template T
 * @param {Array<T>} arr
 * @returns {T}
 */
const sampleArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

const toFormattedTimeString = (ts) => {
  const time = new Date(ts);
  return [
    [
      time.getFullYear(),
      `${time.getMonth() + 1 }`.padStart(2, "0"),
      `${time.getDate()}`.padStart(2, "0"),
    ].join("/"),
    " ",
    [
      `${time.getHours()}`.padStart(2, "0"),
      `${time.getMinutes()}`.padStart(2, "0"),
      `${time.getSeconds()}`.padStart(2, "0"),
    ].join(":"),
  ].join("");
};

module.exports = { extractLocationFromString, sampleArray, toFormattedTimeString };