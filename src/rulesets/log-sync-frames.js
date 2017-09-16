import BaseRuleset from './base-ruleset'
import { SynchronousSpikes } from '../rules'
import { LogCommand } from '../commands'
import { ChannelMatrix } from '../util'

class LogSyncFrames extends BaseRuleset {
  constructor (config = {}, matrix = undefined) {
    super()
    this._config = Object.assign({ iterations: 10, start: 0.005, step: 0.005 }, config)
    this._matrix = matrix
    this._grouping = []
    if (this._matrix) {
      for (let n = 0; n < this._matrix._CHANNEL_COUNT; n++) {
        this._grouping.push(ChannelMatrix.collectChannelIds(this._matrix, n, 1))
      }
    }
    else this._grouping.push([])
    for (let i = 0; i < this._config.iterations; i += 1) {
      for (let group of this._grouping) {
        const key = this._matrix ? this._matrix._ID : undefined,
          pos = i * this._config.step + this._config.start
        this.entries.push(LogSyncFrames.makeSyncRule(1, pos, true, group, key))
        this.entries.push(LogSyncFrames.makeSyncRule(1, pos, false, group, key))
        this.entries.push(LogSyncFrames.makeSyncRule(1, pos * -1.0, false, group, key))
      }
    }
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
