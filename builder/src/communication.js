const rp = require('request-promise')
const Buffer = require('./buffer')

class Communication {
  constructor (config) {
    this.config = config
    this.resource = this.config.build_api_url + 'build/'
    this.startEndpoint = '/start'
    this.stdoutEndpoint = '/stdout'
    this.stderrEndpoint = '/stderr'
    this.endEndpoint = '/end'
    this.packageEndpoint = '/packages'
    this.stdoutBuffer = new Buffer()
    this.stderrBuffer = new Buffer()
  }

  async _req (uri, body) {
    const options = {
      method: 'PUT',
      uri,
      json: !!body,
      body: body || null,
      headers: {
        Authorization: this.config.apikeys.build
      }
    }

    try {
      await rp(options)
    } catch (err) {
      console.error('[error.communication]', err.message, '\n uri :', uri, '\n body:', options.body)
    }
  }

  async verifyAuthorization (id) {
    const url = this.resource + id + '/'
    const options = {
      method: 'PUT',
      uri: url,
      headers: {
        Authorization: this.config.apikeys.build
      }
    }

    await rp(options)
  }

  async startBuild (id) {
    const url = this.resource + id + this.startEndpoint

    await this._req(url)
  }

  async updateStdout (id, stdout) {
    const url = this.resource + id + this.stdoutEndpoint
    const buffered = this.stdoutBuffer.write(stdout)

    if (buffered) {
      await this._req(url, { data: buffered })
    }
  }

  async updateStderr (id, stderr) {
    const url = this.resource + id + this.stderrEndpoint
    const buffered = this.stderrBuffer.write(stderr)

    if (buffered) {
      await this._req(url, { data: buffered })
    }
  }

  async endBuild (id, exitStatus) {
    const url = this.resource + id + this.endEndpoint

    await this.resetBuffer(id)
    await this._req(url, { exit_status: exitStatus })
  }

  async resetBuffer (id) {
    const urlStdout = this.resource + id + this.stdoutEndpoint
    const urlStderr = this.resource + id + this.stderrEndpoint
    const stdout = this.stdoutBuffer.reset()
    const stderr = this.stderrBuffer.reset()

    if (stdout) {
      await this._req(urlStdout, { data: stdout })
    }
    if (stderr) {
      await this._req(urlStderr, { data: stderr })
    }
  }

  async updatePackage (id, data) {
    const url = this.resource + id + this.packageEndpoint

    await this._req(url, data)
  }
}

module.exports = Communication
