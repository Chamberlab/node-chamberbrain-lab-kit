import BaseRule from './base-rule'

class SynchronousSpikes extends BaseRule {
  constructor (maxBuffer = 1, threshold = 1.0, absoluteThreshold = false) {
    super()
    this.maxBuffer = maxBuffer
    this.threshold = absoluteThreshold ? Math.abs(threshold) : threshold
    this.absoluteThreshold = absoluteThreshold
    this._result = {}
  }
  _evaluate () {
    const bufferSize = this.bufferSize
    for (let i = 0; i < bufferSize; i++) {
      const channelSize = this.data[i].length
      for (let c = 0; c < channelSize; c++) {
        if (typeof this.data[i][c] === 'number') {
          const value = this.absoluteThreshold ? Math.abs(this.data[i][c]) : this.data[i][c]
          if ((this.threshold < 0 && value <= this.threshold)) {
            this._result[`${c}_`] = value
          }
          else if (this.threshold > 0 && value >= this.threshold) {
            this._result[`${c}_`] = value
          }
        }
      }
    }
    return this._result
  }
}

export default SynchronousSpikes
