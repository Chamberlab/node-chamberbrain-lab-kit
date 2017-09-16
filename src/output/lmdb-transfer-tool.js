import LMDB from './lmdb'
import Stats from '../util/stats'

class LMDBTransferTool {
  constructor (infile, outfile) {
    this._in = {
      lmdb: new LMDB(),
      stats: new Stats(),
      txn: undefined
    }
    this._in.lmdb.openEnv(infile)
    this._in.txn = this._in.lmdb.beginTxn(true)

    this._out = {
      lmdb: new LMDB(),
      stats: new Stats(),
      txn: undefined
    }
    this._out.lmdb.openEnv(outfile)
    this._out.txn = this._out.lmdb.beginTxn()
  }

  addRecord (id, millis, data) {
    const meta = this._in.lmdb.meta[id],
      key = LMDB.stringKeyFromFloat(millis, meta.key.length, meta.key.precision, meta.key.signed)
    this._out.lmdb.put(this.out.txn, id, key, data)
    this._out.stats.addEntries()
  }
  close () {
    process.stdout.write('Closing LMDB environments...'.yellow)
    this._out.lmdb.endTxn(this.out.txn)
    this._out.lmdb.close()
    this._in.lmdb.endTxn(this._in.txn, false)
    this._in.lmdb.close()
    process.stdout.write('Done.\n'.yellow)

    process.stdout.write('\nINPUT'.cyan)
    this._in.stats.print()

    process.stdout.write('\nOUTPUT'.cyan)
    this._out.stats.print()
  }

  get in () {
    return this._in
  }
  get out () {
    return this._out
  }
}

export default LMDBTransferTool
