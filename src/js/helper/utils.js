/**
 * @template T
 * @param {Array<T>} arr
 * @returns {T}
 */
const sampleArray = (arr) => arr[Math.floor(Math.random() * arr.length)];

module.exports = { sampleArray };