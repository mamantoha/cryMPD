# cryMPD

[![Built with Crystal](https://img.shields.io/badge/built%20with-crystal-000000.svg?style=?style=plastic&logo=appveyor)](https://crystal-lang.org/)

Control [Music Player Daemon](https://www.musicpd.org/) audio playing in the browser

![Screenshot](https://github.com/mamantoha/cryMPD/raw/master/public/images/screenshot.png)

## Features

- [x] Controlling playback (play, pause, skip next, and skip back)
- [x] Scroll current song
- [x] Playback options (shuffle, repeat, and repeat once)
- [x] Change volume
- [x] Change song in the playlist
- [x] A database update
- [x] Displays statistics

## Install

You can install `cryMPD` in different ways.

### Binaries

The project offers precompiled binary packages for Linux and macOS.

Download the latest `crympd_(PLATFORM).zip` from [actions](https://github.com/mamantoha/cryMPD/actions) and unpack to a new folder.

At the bottom of the workflow summary page, there is a dedicated section for artifacts.

Run (from created folder)

```
./bin/crympd
[development] cryMPD is ready to lead at http://0.0.0.0:3001
```

### From sources

`cryMPD` requires [Crystal](https://crystal-lang.org/install/) and [Node.js](https://nodejs.org/en/download/) to be installed.

Clone this repository:

```console
https://github.com/mamantoha/cryMPD.git
cd cryMPD/
```

Install and build `npm` dependencies:

```console
npm install
npm run build
```

Install Crystal dependencies:

```console
shards install
```

Run server:

```console
crystal ./src/crympd.cr
[development] cryMPD is ready to lead at http://0.0.0.0:3001
```

```console
crystal ./src/crympd.cr --mpd_host 192.168.1.1 --mpd_port 6601
```

## Contributing

1. Fork it (<https://github.com/mamantoha/cryMPD/fork>)
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create a new Pull Request

## Contributors

- [Anton Maminov](https://github.com/mamantoha) - creator and maintainer
