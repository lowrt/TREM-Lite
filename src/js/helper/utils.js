/**
 * @template T
 * @param {Array<T>} arr
 * @returns {T}
 */
const sampleArray = (arr) => arr[Math.round(Math.random() * arr.length)];

module.exports = { sampleArray };