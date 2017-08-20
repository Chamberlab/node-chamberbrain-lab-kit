import Big from 'big.js'

const padString = function (str, length, char = ' ', padLeft = false) {
  const pad = new Array(length - str.length).fill(char).join('')
  if (padLeft) {
    return pad + str
  }
  return str + pad
}

const parseDouble = function (value) {
  try {
    return Big(value)
  }
  catch (err) {
    return null
  }
}

export {
  padString,
  parseDouble
}
