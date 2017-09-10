import BaseCommand from './base-command'

class LogCommand extends BaseCommand {
  constructor () {
    super('log')
    this._log = []
    this._counts = []
  }

  get log () {
    return this._log
  }

  get counts () {
    return this._counts
  }

  execute (id, ...args) {
    this._log.push({ id, label: this.label, args })
    if (args.length > 1 && this._counts.indexOf(Object.keys(args[1]).length) === -1) {
      this._counts.push(Object.keys(args[1]).length)
    }
  }
}

export default LogCommand
