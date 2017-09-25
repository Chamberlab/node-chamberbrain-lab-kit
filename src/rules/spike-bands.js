import BaseRule from './base-rule'

class SpikeBands extends BaseRule {
  constructor (config) {
    super()
    this.buffer = config.buffer || 1
    this.band = config.band || { low: 0.0, high: 1.0 }
    this.absolute = (config.absolute)
    this.channels = config.channels || []
    this._result = {}
  }
  _evaluate () {
    let max = Number.MIN_VALUE,
      min = Number.MAX_VALUE
    const bufferSize = this.bufferSize,
      updateMinMax = (value) => {
        max = Math.max(max, value)
        min = Math.min(min, value)
      }
    for (let i = 0; i < bufferSize; i++) {
      const channelSize = this.data[i].length
      for (let c = 0; c < channelSize; c++) {
        if ((!this.channels.length || this.channels.indexOf(c) !== -1) && typeof this.data[i][c] === 'number') {
          const value = this.absolute ? Math.abs(this.data[i][c]) : this.data[i][c]
          if ((value >= this.band.low && value < this.band.high)) {
            this._result[`${c}`] = value
            updateMinMax(value)
          }
        }
      }
    }
    this._result._max = max === Number.MIN_VALUE ? undefined : max
    this._result._min = min === Number.MAX_VALUE ? undefined : min
    return this._result
  }
}

export default SpikeBands
