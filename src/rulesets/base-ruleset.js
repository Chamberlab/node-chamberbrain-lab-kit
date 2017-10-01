import assert from 'assert'

class BaseRuleset {
  constructor (entries = []) {
    this._entries = Array.isArray(entries) ? entries : []
  }

  evaluate (frame, millis) {
    for (let entry of this._entries) {
      // TODO: to copy or not to copy?!
      entry.rule.data = frame.slice()
      let state = entry.rule.state
      if (entry.condition(state)) {
        for (let cmd of entry.commands) cmd.execute(entry.id, millis, state)
      }
    }
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
