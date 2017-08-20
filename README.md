# Chamberbrain Lab Kit

> :sparkles: Tools used by Chamberlab to sonify & visualise [Nanobrain data](https://globalyoungacademy.net/the-well-tempered-brain-or-what-thinking-sounds-like). :dizzy:

![Brrrrainz.](https://media.giphy.com/media/l41m04gr7tRet7Uas/giphy.gif)

## Requirements

### mac OS
* Build tools  
  ``xcode-select --install``
* Node.js v8.4.0 ([Installer](https://nodejs.org/en/download/current/) or [Package Manager](https://nodejs.org/en/download/package-manager/))

:confused: Not sure, but these might be needed, but try installing without them first.
* [Homebrew](https://docs.brew.sh/Installation.html)
* HDF5 libs  
  ``brew install hdf5``
* LMDB libs  
  ``brew install lmdb``

## Installation

```shell
npm install -g https://github.com/chamberlab/node-chamberbrain-lab-kit.git
```

## Usage

:zap: Commands can be executed from the terminal.

### Convert

```bash
blob:node-chamberbrain-lab-kit anton$ nb-convert --help
Commands:
  csv2lmdb  Convert NanoBrains CSV to LMDB                             [default]
  csv2hdf5  Convert NanoBrains CSV to HDF5

Options:
  --infile, -i  CSV input file                                        [required]
  --outdir, -o  LMDB output directory                                 [required]
  --type, -t    Value type to be stored
                            [choices: "Float64", "Float32"] [default: "Float64"]
  --help        Show help                                              [boolean]
  --debug, -d                                                   [default: false]
```

#### Example
```bash
# Convert CSV to LMDB as Float32.

blob:dataconvert anton$ nb-convert -i /Users/foo/goo.csv -o /Users/foo \
> -t Float32 csv2lmdb
```

### Reduce

```bash
blob:node-chamberbrain-lab-kit anton$ nb-reduce --help
Commands:
  fps  Reduce FPS rate of an LMDB db and output as LMDB and HDF5       [default]

Options:
  --infile, -i   LMDB input file                                      [required]
  --outfile, -o  LMDB output file, also used for HDF5                 [required]
  --fps, -f      Target frames per second                     [default: "100.0"]
  --help         Show help                                             [boolean]
  --debug, -d                                                   [default: false]
```

#### Example
```bash
# Reduce LMDB to 50 frames per second.

blob:dataconvert anton$ nb-reduce -i /Users/foo/goo.lmdb \
> -o /Users/foo/goo-50fps.lmdb -f 50.0
```

### Playback

:zap: Broadcast can be activated using a remote IP like ``192.168.0.255:9999``.

```bash
blob:node-chamberbrain-lab-kit anton$ nb-playback --help
Commands:
  lmdb2osc  Realtime playback of an LMDB file as OSC packets           [default]

Options:
  --infile, -i   LMDB input file                                      [required]
  --fps, -f      Target frames per second                      [default: "50.0"]
  --local, -l    Local OSC address to listen on      [default: "127.0.0.1:8888"]
  --remote, -r   Remote OSC address to send to       [default: "127.0.0.1:9999"]
  --address, -a  Override default OSC address
  --help         Show help                                             [boolean]
  --debug, -d                                                   [default: false]
```

#### Example
```bash
# Play back LMDB with 50 frames per second.
# Bind to 0.0.0.0:7878 and broadcast OSC packets to 192.168.0.255:7777.

blob:dataconvert anton$ nb-playback -i /Users/foo/goo.lmdb \
> -f 50.0 -l 0.0.0.0:7878 -r 192.168.0.255:7777
```

## Credits

:godmode: 2017 Das Antonym / Chamberlab   
Licensed under the :trollface: [Do What The Fuck You Want To Public License](https://bitbucket.org/dasantonym/node-dataconvert/src/master/LICENSE)
