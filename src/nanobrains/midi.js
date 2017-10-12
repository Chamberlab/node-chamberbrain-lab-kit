const midi = require('midi')
const tonal = require('tonal')
// Set up a new input.
const input = new midi.input()

// Count the available input ports.
const ports = input.getPortCount()

// Get the name of a specified input port.
const name = input.getPortName(0)

const modes = require('../util/harmonic-matrix').modes
const roots = require('../util/harmonic-matrix').roots
const chordMap = require('../util/harmonic-matrix').chordMap
const OSC = require('../playback').OSC,
  oscout = new OSC(undefined, '192.168.0.126:8010')
  // oscout = new OSC(undefined, '127.0.0.1:8010')

// Sysex, timing, and active sensing messages are ignored
// by default. To enable these message types, pass false for
// the appropriate type in the function below.
// Order: (Sysex, Timing, Active Sensing)
// For example if you want to receive only MIDI Clock beats
// you should use
// input.ignoreTypes(true, false, true)
input.ignoreTypes(false, false, false)

// ... receive MIDI messages ...
let notes = [],
  currentDegree = null,
  notesFull = [],
  processNotes = [],
  scale = null,
  scaleInd = 0,
  dtscale,
  dtsparsed = []

new Promise(resolve => {
  // Configure a callback.
  input.on('message', function (deltaTime, message) {
    // The message is an array of numbers corresponding to the MIDI bytes:
    //   [status, data1, data2]
    // https://www.cs.cf.ac.uk/Dave/Multimedia/node158.html has some helpful
    // information interpreting the messages.
    let note = tonal.note.fromMidi(message[1])
    if (note && notesFull.indexOf(note) === -1) notesFull.push(note)
    if (note.length > 1) note = note.substr(0, note.length - 1)
    if (note && notes.indexOf(note) === -1) notes.push(note)
  })

  input.openPort(0)

  function waitfunc () {
    setTimeout(waitfunc, 40)
    processNotes = notes
    notes = []
    dtscale = tonal.scale.detect(processNotes)
    const ls = dtscale.filter(k => {
      const tokens = tonal.scale.parse(k)
      for (let m of modes) {
        if (tokens.type && tokens.type.indexOf(m) !== -1) {
          return true
        }
      }
    })
    ls.forEach(sc => {
      let scp = tonal.scale.parse(sc)
      if (scp && scp.type && scp.type !== scale) {
        let ind = -1
        modes.forEach((m, i) => {
          let id = scp.type.indexOf(m)
          if (id > -1) ind = i
        })
        scaleInd = ind
        scale = modes[ind]
      }
    })

    const chord = tonal.chord.detect(notesFull)
    if (chord && chord.length) {
      let found = false,
        tokens = null
      chord.forEach(fchrd => {
        fchrd = tonal.chord.parse(fchrd)
        let n = 0
        for (let deg in chordMap) {
          for (let chrd of chordMap[deg]) {
            if (!found) {
              tokens = tonal.chord.parse(chordMap[deg][chrd])
              if (tokens.type === fchrd.type) {
                found = fchrd
                if (currentDegree !== deg) {
                  currentDegree = deg
                }
              }
            }
          }
          n++
        }
      })
    }

    notesFull = []

    const idx = 0

    let msgs = roots.map((note, i) => {
      return OSC.buildMessage(`/surface/${note}/opacity`, [processNotes.indexOf(note) > -1 ? 1.0 : 0.0])
    })
    modes.forEach(mode => {
      msgs.push(OSC.buildMessage(`/surface/${mode}/opacity`, [mode === scale ? 1.0 : 0.0]))
    })
    Object.keys(chordMap).forEach(deg => {
      msgs.push(OSC.buildMessage(`/surface/${deg}/opacity`, [deg === currentDegree ? 1.0 : 0.0]))
    })
    oscout.sendBundle(msgs)
    // oscout.sendBundle([OSC.buildMessage(`/surface/A/opacity`, [Math.random()])])
    console.log(msgs.map(msg => { return msg.args.map(arg => { return arg.value }).join(' ') }).join(' | '))
  }

  setTimeout(waitfunc, 40)
}).then(() => {
  // Close the port when done.
  input.closePort()
})
