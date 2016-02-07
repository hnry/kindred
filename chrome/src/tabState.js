class TabState {
  constructor() {
    this._tabs = []
    this._subscribers = []
  }

  get(tabId) {
    for (let i = 0, l = this._tabs.length; i < l; i++) {
      const t = this._tabs[i]
      if (t && t.id == tabId) {
        return t
      }
    }
    return undefined
  }

  _getIndex(tabId) {
    for (let i = 0, l = this._tabs.length; i < l; i++) {
      const t = this._tabs[i]
      if (t && t.id == tabId) {
        return i
      }
    }
    return undefined
  }

  set(tabId, data) {
    const tid = this._getIndex(tabId)
    if (tid === undefined) {
      this._tabs.push(data)
    } else {
      this._tabs[tid] = data
    }
  }

  add(tabId, url, moduleData, file) {
    this.update(tabId, url, moduleData, file)
  }

  update(tabId, url, moduleData, file) {
    let data = moduleData
    data.currentUrl = url
    data.lastSync = null
    data.file = file

    this.set(tabId, data)
    this.publish()
  }

  remove(tabId) {
    const tid = this._getIndex(tabId)
    if (tid !== undefined) {
      this._tabs[tid] = null
    }
    this.publish()
  }

  subscribe(fn) {
    this._subscribers.push(fn)
  }

  publish() {
    this._subscribers.forEach((fn) => {
      fn(this._tabs)
    })
  }
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabState
}
