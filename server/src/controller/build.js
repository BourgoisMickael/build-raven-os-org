class BuildController {
  constructor (app) {
    this.app = app
    this.state = {
      QUEUING: 'queuing',
      RUNNING: 'running',
      FINISHED: 'finished'
    }
  }

  async _get (id) {
    const buildModel = await this.app.database.model.build
      .where('id', id)
      .fetch()

    if (!buildModel) {
      throw new this.app.errors.NotFound(`Build #${id} not found`)
    }

    return buildModel
  }

  async _get (id) {
    const buildModel = await this.app.database.model.build
      .where('id', id)
      .fetch()

    if (!buildModel) {
      throw new this.app.errors.NotFound(`Build #${id} not found`)
    }

    return buildModel
  }

  async create (ids) {
    for (let id of ids) {
      if (!await this.app.controller.manifest.exists(id)) {
        throw new this.app.errors.NotFound(`Manifest #${id} not found`)
      }
    }

    const date = new Date()

    const build = await this.app.database.model.build.forge({
      manifest_id: ids,
      exit_status: null,
      stdout: '',
      stderr: '',
      creation_date: date,
      start_date: null,
      end_date: null,
      state: this.state.QUEUING
    })
      .save()

    const date = new Date()

    const build = await this.app.database.model.build.forge({
      manifest_id: ids,
      queuing: true,
      running: false,
      exit_status: null,
      stdout: '',
      stderr: null,
      creation_date: date,
      start_date: null,
      end_date: null
    })
      .save()

    const msg = {
      build: build.id,
      manifests: ids
    }

    await this.app.queue.send(Buffer.from(JSON.stringify(msg)))
    return build.toJSON()
  }

  async stdout (id, stdout) {
    let build = await this._get(id)

    await build
      .save({
        stdout: this.app.database.utils.raw('concat(stdout, ?::text)', stdout)
      })

    build = await build.refresh()

    return build.toJSON()
  }

  async stderr (id, stderr) {
    let build = await this._get(id)

    await build
      .save({
        stderr: this.app.database.utils.raw('concat(stderr, ?::text)', stderr)
      })

    build = await build.refresh()

    return build.toJSON()
  }

  async start (id) {
    let build = await this._get(id)
    const date = new Date()

    await build
      .save({
        state: this.state.RUNNING,
        start_date: date
      })

    build = await build.refresh()

    return build.toJSON()
  }

  async end (id, exitStatus) {
    let build = await this._get(id)
    const date = new Date()

    await build
      .save({
        state: this.state.FINISHED,
        exit_status: exitStatus,
        end_date: date
      })

    build = await build.refresh()

    return build.toJSON()
  }

  async get (id) {
    const build = await this._get(id)

    return build.toJSON()
  }

  // TODO: filters
  async list () {
    const builds = await this.app.database.model.build
      .fetchAll()

    return builds.toJSON()
  }
}

module.exports = BuildController
