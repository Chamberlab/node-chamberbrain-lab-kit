import BaseRuleset from './base-ruleset'
import { SpikeBands } from '../rules'
import { LogCommand } from '../commands'
import { ChannelMatrix, filters } from '../util'

class LogBandFrames extends BaseRuleset {
  constructor (matrix = undefined) {
    super()
    this._matrix = matrix
    this._grouping = []

    if (this.matrix) {
      for (let n = 0; n < this.matrix._CHANNEL_COUNT; n++) {
        this.grouping.push(ChannelMatrix.collectChannelIds(this.matrix, n, 1))
      }
    }
    else this.grouping.push([])
  }

  get grouping () {
    return this._grouping
  }
  get matrix () {
    return this._matrix
  }

  static makeBandRule (buffer, band, absolute, channels, prefix = '') {
    const cstrs = channels.map(c => { return (c.toString().length === 1 ? '0' : '') + c.toString() }),
      sig = Math.sign(band.high) < 0 ? 'neg' : 'pos',
      group = channels.length ? cstrs.sort().join('') : '',
      config = { buffer, band, absolute, channels, group }
    return {
      id: `group_${prefix}_${group}_band_${buffer}_${absolute ? 'abs' : sig}_${band.low.toFixed(3)}x${band.high.toFixed(3)}`,
      rule: new SpikeBands(config),
      condition: (result) => { return filters.removePrefixedFromArray(Object.keys(result || {})).length > 0 },
      commands: [new LogCommand()]
    }
  }
}

export default LogBandFrames
