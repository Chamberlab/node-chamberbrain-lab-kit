import 'colors'
import assert from 'assert'
import moment from 'moment'
import microtime from 'microtime'

class Stats {
  constructor () {
    this._entries = 0
    this._errors = 0
    this._start = moment()
    this._micros = 0
  }
  addEntries (count = 1) {
    assert.equal(typeof count, 'number')
    this._entries += count
  }
  addErrors (count = 1) {
    assert.equal(typeof count, 'number')
    this.addEntries(count)
    this._errors += count
  }
  print () {
    let stats = '\n'
    stats += `STATS ${new Array(66).fill('-').join('')}\n`.cyan
    stats += '\n'
    stats += `Task started:   ${this.start.format('MM/DD/YYYY HH:mm:ss')}\n`
    stats += `Task ended:     ${moment().format('MM/DD/YYYY HH:mm:ss')}\n`
    stats += `Time spent:     ${this.start.toNow(true)}\n`.yellow
    stats += '\n'
    stats += `Rows total:     ${this.entries}\n`.yellow
    stats += `Rows imported:  ${this.imported}\n`.green
    stats += `Rows failed:    ${this.errors}\n`.red
    stats += '\n'
    process.stdout.write(stats + '\n')
  }
  get entries () {
    return this._entries
  }
  get imported () {
    return this.entries - this.errors
  }
  get errors () {
    return this._errors
  }
  get start () {
    return this._start
  }
  get micros () {
    return this._micros ? microtime.now() - this._micros : 0
  }
  set micros (val) {
    this._micros = val || microtime.now()
  }
}

export default Stats
