import SynchronousSpikes from './synchronous-spikes'
import commands from '../commands'

class Ruleset {
  constructor () {
    this._set = [
      {
        rule: new SynchronousSpikes(1, 0.05, true),
        condition: function (result) {
          return Object.keys(result).length
        },
        commands: [new commands.LogCommand()]
      }
    ]
  }
  evaluate (frame, millis) {
    this._set.forEach(entry => {
      entry.rule.data = frame
      const state = entry.rule.state,
        result = entry.condition(state)
      if (result) {
        entry.commands.forEach(cmd => {
          cmd.execute(millis, state)
        })
      }
    })
  }
}

export default Ruleset
