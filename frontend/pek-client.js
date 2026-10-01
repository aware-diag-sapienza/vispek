/*
npm install socket.io-client

<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js" integrity="sha512-q/dWJ3kcmjBLU4Qc47E4A9kTB4m3wuTY7vkFJDTZKjTs8jhyGQnaUrxa0Ytd0ssMZhbNua9hE+E7Qv1j+DyZwA==" crossorigin="anonymous"></script>

import { io } from "socket.io-client";
*/

function _parseJSON(json){
  // robust parsing aginst Nan and infinity
  return JSON.parse(json, function (key, value) {
    if (value === 'NaN') {
        return NaN;
    }
    if (value === 'Infinity') {
        return Infinity;
    }
    if (value === '-Infinity') {
        return -Infinity;
    }
    return value;
});
}

async function PekClient (url, verbose = false) {
  const p = new Promise((resolve, reject) => {
    const socket = io(url)
    socket.on('connect', () => {
      if (verbose) console.log(`[PekClient] Connected to server at ${url}`)
      resolve(new PekClientInstance(socket, verbose))
    })
  })
  return p
}

class PekDataset {
  constructor (dict) {
    Object.keys(dict).forEach(key => {
      this[key] = dict[key]
    })
  }
}

class PekClientInstance {
  constructor (socket, verbose = false) {
    this.id = socket.id
    this._socket = socket
    this._verbose = verbose
  }

  async getServerVersion () {
    return new Promise((resolve, reject) => {
      this._socket.emit('get-pek-version', null, (version) => {
        resolve(version)
      })
    })
  }

  async getDatasetsList () {
    return new Promise((resolve, reject) => {
      this._socket.emit('get-datasets-list', null, (res) => {
        resolve(res)
      })
    })
  }

  async getDataset (name, insertData = false) {
    return new Promise((resolve, reject) => {
      const datajson = JSON.stringify({ name, insertData })
      this._socket.emit('get-dataset', datajson, (res) => {
        try {
          const dataset = new PekDataset(_parseJSON(res))
          resolve(dataset)
        } catch (e) {
          reject(e)
        }
      })
    })
  }

  async createElbowTask (dataset, args = {}) {
    args.dataset = (dataset instanceof PekDataset) ? dataset.name : `${dataset}`
    return new Promise((resolve, reject) => {
      const argsjson = JSON.stringify(args)
      this._socket.emit('create-elbow-task', argsjson, (taskId) => {
        const task = new ElbowTask(taskId, args, this._socket, this._verbose)
        resolve(task)
      })
    })
  }

  async createEnsembleTask (dataset, args = {}) {
    args.dataset = (dataset instanceof PekDataset) ? dataset.name : `${dataset}`
    return new Promise((resolve, reject) => {
      const argsjson = JSON.stringify(args)
      this._socket.emit('create-ensemble-task', argsjson, (taskId) => {
        const task = new EnsembleTask(taskId, args, this._socket, this._verbose)
        resolve(task)
      })
    })
  }
}

const TaskStatus = {
  pending: 'pending',
  running: 'running',
  paused: 'paused',
  killed: 'killed',
  completed: 'completed'
}

class _PekTask {
  constructor (id, args, socket, verbose = false) {
    this.id = id
    this.args = args
    this.status = TaskStatus.pending

    this._socket = socket
    this._verbose = verbose
    this._onPartialResultCallback = () => {}
    this._partialResultClass = null

    this._socket.on(this.id, (str) => {
      let obj = null
      eval(`obj = ${str}`)

      //const obj = _parseJSON(str)
      const partialResult = this._partialResultClass === null ? obj : new this._partialResultClass(obj)
      this._onPartialResultCallback(partialResult)
    })
  }

  async _send (eventName, status = null, args = {}) {
    return new Promise((resolve, reject) => {
      const datajson = JSON.stringify({ taskId: this.id, args })
      this._socket.emit(eventName, datajson, () => {
        if (status !== null) this.status = status
        resolve()
      })
    })
  }

  async start () {
    if (this.status !== TaskStatus.pending) throw Error(`${this.constructor.name} ${this.id} has already been started.`)
    this._send('start-task', TaskStatus.running)
    return this
  }

  async pause () {
    if (this.status !== TaskStatus.running) throw Error(`${this.constructor.name} ${this.id} is not running.`)
    this._send('pause-task', TaskStatus.paused)
    return this
  }

  async resume () {
    if (this.status !== TaskStatus.paused) throw Error(`${this.constructor.name} ${this.id} is not paused.`)
    this._send('resume-task', TaskStatus.running)
    return this
  }

  async kill () {
    if (this.status !== TaskStatus.running) throw Error(`${this.constructor.name} ${this.id} is not running.`)
    this._send('kill-task', TaskStatus.killed)
    return this
  }

  onPartialResult (callback) {
    this._onPartialResultCallback = callback
    return this
  }
}

class ElbowTask extends _PekTask {
  constructor (id, args, socket, verbose = false) {
    super(id, args, socket, verbose)
    this._partialResultClass = ElbowPartialResult
  }
}

class EnsembleTask extends _PekTask {
  constructor (id, args, socket, verbose = false) {
    super(id, args, socket, verbose)
    this._partialResultClass = EnsemblePartialResult
  }

  async killRun (runId) {
    if (this.status !== TaskStatus.running) throw Error(`${this.constructor.name} ${this.id} is not running.`)
    return this._send('kill-ensemble-task-run', null, { runId })
  }
}

class EnsemblePartialResult {
  constructor (dict) {
    Object.keys(dict).forEach(key => {
      this[key] = dict[key]
    })
  }
}

class ElbowPartialResult {
  constructor (dict) {
    Object.keys(dict).forEach(key => {
      this[key] = dict[key]
    })
  }
}
