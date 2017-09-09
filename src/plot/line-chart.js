const Plotly = require('plotly')('dasantonym', '60HakQcPwevMXP9Ge9Jh')

class LineChart {
  constructor (opts) {
    this._opts = opts
    this._chart = undefined
    this._output = undefined
    this._axes = undefined
    this._x = []
    this._y = undefined
  }

  set axes (val) {
    this._axes = val
  }

  makePlot () {
    const _ctx = this
    return new Promise(function (resolve, reject) {
      _ctx._chart = Plotly.plot([{
        x: _ctx._axes.x,
        y: _ctx._axes.y,
        type: 'lines'
      }], {filename: 'date-axes', fileopt: 'overwrite'}, function (err, msg) {
        console.log(msg)
        if (err) {
          return reject(err)
        }
        resolve(_ctx._chart)
      })
    })
  }
}

export default LineChart
