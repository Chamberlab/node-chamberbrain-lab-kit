import SynchronousSpikes from './synchronous-spikes'
import commands from '../commands'
import ChannelMatrix from './channel-matrix'

class Ruleset {
  constructor () {
    this._set = []
    this._groupSets = {
      A: [],
      B: [],
      C: []
    }
    for (let key in this._groupSets) {
      const matrix = ChannelMatrix[key]
      for (let n = 0; n < matrix.CHANNEL_COUNT; n++) {
        this._groupSets[key].push(ChannelMatrix.collectChannelIds(matrix, n))
      }
    }
    console.log(this._groupSets)
    for (let i = 1; i < 100; i++) {
      this._set.push(Ruleset.makeSyncRule(1, i * 0.005, false, []))
      this._set.push(Ruleset.makeSyncRule(1, i * -0.005, false, []))
    }
  }
  evaluate (frame, millis) {
    this._set.forEach(entry => {
      entry.rule.data = frame
      const state = entry.rule.state,
        result = entry.condition(state)
      if (result) {
        entry.commands.forEach(cmd => {
          cmd.execute(cmd.id, millis, state)
        })
      }
    })
  }

  static makeSyncRule (buffer, threshold, absolute, channels) {
    const sig = Math.sign(threshold) < 0 ? 'neg' : 'pos',
      group = channels.length ? channels.join('') : '',
      config = {
        id: `group_${group}_sync_${buffer}_${absolute ? 'abs' : sig}_${threshold.toFixed(3)}`,
        buffer,
        threshold,
        absolute,
        channels
      }

    return {
      rule: new SynchronousSpikes(config),
      condition: function (result) {
        return Object.keys(result).length > 1
      },
      commands: [new commands.LogCommand()]
    }
  }
}

export default Ruleset
