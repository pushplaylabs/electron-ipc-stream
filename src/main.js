const Duplex = require('stream').Duplex
const ipcMain = require('electron').ipcMain
const util = require('util')

function MainIPCStream (channel, browserWindow, streamOpts) {
  if (!(this instanceof MainIPCStream)) {
    return new MainIPCStream(channel, browserWindow, streamOpts)
  }
  streamOpts = streamOpts || {}
  streamOpts.objectMode = streamOpts.objectMode ? streamOpts.objectMode : true

  this.browserWindow = browserWindow
  this.channel = channel

  const ipcCallback = (event, data) => {
    this.push(data)
  }
  ipcMain.on(this.channel, ipcCallback)

  this.on('finish', () => {
    if (this.browserWindow) this.browserWindow.webContents.send(this.channel + '-finish')
    ipcMain.removeListener(this.channel, ipcCallback)
  })
  ipcMain.once(this.channel + '-finish', () => this.push(null))

  Duplex.call(this, streamOpts)
}
util.inherits(MainIPCStream, Duplex)

MainIPCStream.prototype._read = function () { }

MainIPCStream.prototype._write = function (data, enc, next) {
  if (!this.browserWindow) return console.warn('MainIPCStream: trying to write when no browserWindow is set.')
  this.browserWindow.webContents.send(this.channel, data)
  next()
}

module.exports = MainIPCStream
