import harmonics from 'chamberlib/dist/harmonics'
import events from 'chamberlib/dist/events'
import data from 'chamberlib/dist/data'

class MIDI {
  static notesToMidi (notes, durationMs = 20, filename) {
    const tracks = []
    for (let gid in notes) {
      const track = new data.Track([], `${gid}`, gid)
      for (let ms in notes[gid]) {
        notes[gid][ms].forEach(note => {
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
