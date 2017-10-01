const framesByTimeAsc = function (a, b) {
  return a[0] - b[0]
}

const primitveNumbersAsc = function (a, b) {
  return parseInt(a) - parseInt(b)
}

export {
  framesByTimeAsc,
  primitveNumbersAsc
}
