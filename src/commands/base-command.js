class BaseCommand {
  constructor (label = 'noop') {
    this._label = label
  }
  execute () {}

  get label () {
    return this._label
  }
}

export default BaseCommand
