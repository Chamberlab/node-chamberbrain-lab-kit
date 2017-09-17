import assert from 'assert'

class BaseRuleset {
  constructor (set = []) {
    this._entries = set
  }

  evaluate (frame, millis) {
    this._entries.forEach(entry => {
      entry.rule.data = frame
      const state = entry.rule.state,
        result = entry.condition(state)
      if (result) {
        entry.commands.forEach(cmd => {
          cmd.execute(entry.id, millis, state)
        })
      }
    })
  }

  get entries () {
    return this._entries
  }
  set entries (val) {
    assert.ok(Array.isArray(val))
    this._entries = val
  }
}

export default BaseRuleset
