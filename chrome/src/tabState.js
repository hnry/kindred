/*
  State is either changed through addState or removeState (input)

  Any changes are handled by onChange (passed in on initiation) (output)
 */
class TabState {
  constructor(onChange) {
    this.state = []
    this._prevState = []
    this.onChange = onChange || function() {}
  }

  _findIndexById(id) {
    for (let i = 0, l = this.state.length; i < l; i++) {
      const t = this.state[i]
      if (t && t.id == id) {
        return i
      }
    }
    return undefined
  }

  addState(tabData) {
    const idx = this._findIndexById(tabData.id)
    this._willChangeState()

    if (idx !== undefined) {
      this.state[idx] = tabData
    } else {
      this.state.push(tabData)
    }

    this._changedState()
  }

  removeState(tabId) {
    const idx = this._findIndexById(tabId)
    if (idx !== undefined) {
      this._willChangeState()
      this.state.splice(idx, 1)
      this._changedState()
    }
  }

  _willChangeState() {
    this._prevState = this.state.slice(0, this.state.length)
  }

  _diffState() {
    const k = 'file'
    const fp = (state) => {
      return state[k]
    }
    const ps = this._prevState.filter(fp)
    const cs = this.state.filter(fp)

    function diff(a, b) {
      return a.filter((aa) => {
        return b.filter((bb) => {
          return aa[k] === bb[k]
        }).length === 0
      }).length !== 0
    }
    return diff(ps, cs) || diff(cs, ps)
  }

  // call onChange if there's a difference
  _changedState() {
    if (this._diffState()) {
      this.onChange(this.state)
    }
  }
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabState
}
