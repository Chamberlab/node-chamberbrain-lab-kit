import BaseRuleset from './base-ruleset'
import { SynchronousSpikes } from '../rules'
import { LogCommand } from '../commands'
import { filters } from '../util'

class LogSyncFrames extends BaseRuleset {
  constructor (matrixId = undefined) {
    super(matrixId)
  }

  static makeSyncRule (buffer, threshold, absolute, channels, prefix = '') {
    const cstrs = channels.map(c => { return (c.toString().length === 1 ? '0' : '') + c.toString() }),
      sig = absolute ? 'abs' : Math.sign(threshold) < 0 ? 'neg' : 'pos',
      group = channels.length ? cstrs.sort().join('') : '',
      config = { buffer, threshold, absolute, channels, group }
    return {
      id: `group_${prefix}_${group}_sync_${buffer}_${sig}_${threshold.toFixed(3)}`,
      rule: new SynchronousSpikes(config),
      condition: (result) => { return filters.removePrefixedFromArray(Object.keys(result || {})).length > 1 },
      commands: [new LogCommand()]
    }
  }
}

export default LogSyncFrames
