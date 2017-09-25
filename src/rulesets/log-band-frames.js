import BaseRuleset from './base-ruleset'
import { SpikeBands } from '../rules'
import { LogCommand } from '../commands'
import { ChannelMatrix } from '../util'

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
    const sig = Math.sign(band.high) < 0 ? 'neg' : 'pos',
      group = channels.length ? channels.join('') : '',
      config = { buffer, band, absolute, channels }

    return {
      id: `group_${prefix}_${group}_band_${buffer}_${absolute ? 'abs' : sig}_${band.low.toFixed(3)}x${band.high.toFixed(3)}`,
      rule: new SpikeBands(config),
      condition: function (result) {
        return Object.keys(result).filter(key => { return key[0] !== '_' }).length > 0
      },
      commands: [new LogCommand()]
    }
  }
}

export default LogBandFrames
