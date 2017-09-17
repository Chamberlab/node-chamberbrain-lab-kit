import BaseRuleset from './base-ruleset'
import { SynchronousSpikes } from '../rules'
import { LogCommand } from '../commands'
import { ChannelMatrix } from '../util'

class LogSyncFrames extends BaseRuleset {
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

  static makeSyncRule (buffer, threshold, absolute, channels, prefix = '') {
    const sig = Math.sign(threshold) < 0 ? 'neg' : 'pos',
      group = channels.length ? channels.join('') : '',
      config = { buffer, threshold, absolute, channels }

    return {
      id: `group_${prefix}_${group}_sync_${buffer}_${absolute ? 'abs' : sig}_${threshold.toFixed(3)}`,
      rule: new SynchronousSpikes(config),
      condition: function (result) {
        return Object.keys(result).filter(key => { return key[0] !== '_' }).length > 1
      },
      commands: [new LogCommand()]
    }
  }
}

export default LogSyncFrames
