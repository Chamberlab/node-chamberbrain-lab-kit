import BaseCommand from './base-command'

class LogCommand extends BaseCommand {
  constructor () {
    super('log')
    this._log = []
  }

  get log() {
    return this._log
  }

  execute (id, ...args) {
    this._log.push({ id, label: this.label, args })
  }
}

export default LogCommand
