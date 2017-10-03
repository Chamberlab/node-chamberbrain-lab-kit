import harmonics from 'chamberlib/dist/harmonics'
import events from 'chamberlib/dist/events'
import data from 'chamberlib/dist/data'
import LMDB from '../output/lmdb'

class MIDI {
  static notesToMidi (notes, durationMs = 20, filename) {
    const tracks = []
    for (let gid in notes) {
      const track = new data.Track([], `${gid}`, gid)
      for (let key in notes[gid]) {
        let ms = LMDB.parseKey(key).round()
        notes[gid][key].forEach(note => {
          if (note) {
            const nte = new harmonics.Note(note)
            nte.fromString(note)
            const te = new events.TonalEvent(`${ms} ms`, nte, `${durationMs} ms`)
            track.push(te)
          }
          else {
            process.stderr.write('Warning: Ignoring attempt to add empty note\n')
          }
        })
      }
      tracks.push(track)
    }
    return new data.Song(tracks, 120).toMidiFile(filename)
  }
}

export default MIDI
