import BaseRuleset from './base-ruleset'
import { SpikeBands } from '../rules'
import { LogCommand } from '../commands'
import { filters } from '../util'

class LogBandFrames extends BaseRuleset {
  constructor (matrixId = undefined) {
    super(matrixId)
  }

  static makeBandRule (buffer, band, absolute, channels, prefix = '') {
    const cstrs = channels.map(c => { return (c.toString().length === 1 ? '0' : '') + c.toString() }),
      sig = Math.sign(band.high) < 0 ? 'neg' : 'pos',
      group = channels.length ? cstrs.sort().join('') : '',
      config = { buffer, band, absolute, channels, group },
      logCom = new LogCommand()
    return {
      id: `group_${prefix}_${group}_band_${buffer}_${absolute ? 'abs' : sig}_${band.low.toFixed(3)}x${band.high.toFixed(3)}`,
      rule: new SpikeBands(config),
      condition: function (result) { return filters.removePrefixedFromArray(Object.keys(result || {})).length > 0 },
      commands: [logCom]
    }
  }
}

export default LogBandFrames
