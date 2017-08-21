# Chamberbrain Lab Kit

[![npm version](https://badge.fury.io/js/chamberbrain-lab-kit.svg)](https://badge.fury.io/js/chamberbrain-lab-kit)
[![Code Climate](https://codeclimate.com/github/Chamberlab/node-chamberbrain-lab-kit/badges/gpa.svg)](https://codeclimate.com/github/Chamberlab/node-chamberbrain-lab-kit)
[![Build Status](https://travis-ci.org/Chamberlab/node-chamberbrain-lab-kit.svg?branch=master)](https://travis-ci.org/Chamberlab/node-chamberbrain-lab-kit)

![Brrrraiiinnz, pls!](https://media.giphy.com/media/l41m04gr7tRet7Uas/giphy.gif)

> :hammer::wrench::syringe: **contraption** used by [:squirrel:](https://soundcloud.com/kammerorchester) & [:shipit:](https://soundcloud.com/antonym) of [**Chamberlab**](https://soundcloud.com/chamberlab) to :musical_note: **sonify** and :fireworks: **visualise** precious :gem: [**Nanobrain**](https://globalyoungacademy.net/the-well-tempered-brain-or-what-thinking-sounds-like) **data files**. :dizzy:

## Requirements

Tested on:
* macOS 10.11 & 10.12
* Ubuntu 14.04

### Dependencies

* **Build tools**  
  macOS >= 10.9: ``xcode-select --install``  
  Ubuntu >= 16.04: ``sudo apt-get install build-essential``  
  Ubuntu ~= 14.04: ``sudo apt-get install build-essential gcc-4.9 g++-4.9``  
  
* **Node.js >= 8.4.0**  
  Install via [NVM](https://github.com/creationix/nvm#installation) (recommended), "one-click" [Installer](https://nodejs.org/en/download/current/) or your favourite choice of [Package Manager](https://nodejs.org/en/download/package-manager/).

* **HDF5 library** ([more info)](https://www.hdfgroup.org/downloads/hdf5/)  
  macOS via [Homebrew](https://docs.brew.sh/Installation.html): ``brew install hdf5``  
  Ubuntu: ``sudo apt-get install libhdf5-dev``
  
## Installation

```shell
# On Ubuntu ~= 14.04 select the correct compiler
export CC=gcc-4.9 && CXX=g++-4.9

# Otherwise only run this
npm install -g chamberbrain-lab-kit
```

## Usage

:zap: Commands can be executed from the terminal.

### nb-convert

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

blob:node-chamberbrain-lab-kit anton$ nb-convert -i /Users/foo/goo.csv \
> -o /Users/foo -t Float32 csv2lmdb
```

### nb-reduce

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

blob:node-chamberbrain-lab-kit anton$ nb-reduce -i /Users/foo/goo.lmdb \
> -o /Users/foo/goo-50fps.lmdb -f 50.0
```

### nb-playback

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

blob:node-chamberbrain-lab-kit anton$ nb-playback -i /Users/foo/goo.lmdb \
> -f 50.0 -l 0.0.0.0:7878 -r 192.168.0.255:7777
```

## Credits :euro: :yen: :dollar: :euro: :yen: :dollar: :euro: :yen: :dollar:

2017 :trollface: of Chamberlab    
Licensed under the :sparkles: [Do What The Fuck You Want To Public License](https://github.com/Chamberlab/node-chamberbrain-lab-kit/blob/master/LICENSE) :sparkles:
