import BaseRule from './base-rule'
import { Stats } from '../util'

class SpikeBands extends BaseRule {
  constructor (config) {
    super('spike_bands')
    this.maxBuffer = config.buffer || 1
    this.band = config.band || { low: 0.0, high: 1.0 }
    this.absolute = (config.absolute)
    this.channels = config.channels || []
    this._result = {}
  }
  _evaluate () {
    const bufferSize = this.bufferSize
    for (let i = 0; i < bufferSize; i++) {
      const channelSize = this.data[i].length
      for (let c = 0; c < channelSize; c++) {
        if ((!this.channels.length || this.channels.indexOf(c) !== -1) && typeof this.data[i][c] === 'number') {
          const value = this.absolute ? Math.abs(this.data[i][c]) : this.data[i][c]
          if ((value >= this.band.low && value < this.band.high)) this._result[`${c}`] = value
          this._result._range = Stats.updateValueRange(value, this._result._range)
        }
      }
    }
    return Object.keys(this._result).length > 1 ? this._result : null
  }
}

export default SpikeBands
