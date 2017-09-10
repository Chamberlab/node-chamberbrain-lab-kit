import SynchronousSpikes from './synchronous-spikes'
import commands from '../commands'

class Ruleset {
  constructor () {
    const makeSync = function (buffer, threshold, abs, channels) {
      const sig = Math.sign(threshold) < 0 ? 'neg' : 'pos',
        group = channels.length ? channels.join('') : ''
      return {
        id: `group_${group}_sync_${buffer}_${abs ? 'abs' : sig}_${threshold.toFixed(3)}`,
        rule: new SynchronousSpikes(buffer, threshold, abs),
        condition: function (result) {
          return Object.keys(result).length > 1
        },
        commands: [new commands.LogCommand()]
      }
    }
    this._set = []
    for (let i = 1; i < 100; i++) {
      this._set.push(makeSync(1, i * 0.005, false, []))
      this._set.push(makeSync(1, i * -0.005, false, []))
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
}

export default Ruleset
