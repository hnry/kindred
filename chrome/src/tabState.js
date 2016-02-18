'use strict';

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
    this._prevState = this.state.slice()
  }

  _diffState() {
    const ps = this.renderFiles(this._prevState)
    const cs = this.renderFiles(this.state)

    function diff(a, b) {
      return a.filter((aa) => {
        return b.filter((bb) => {
          return aa === bb
        }).length === 0
      }).length !== 0
    }
    return diff(ps, cs) || diff(cs, ps)
  }

  // call onChange if there's a difference
  _changedState() {
    if (this._diffState()) {
      this.onChange(this, this.state)
    }
  }

  renderFiles(st) {
    st = st || this.state

    return st.reduce((files, tab) => {
      const path = tab.action && tab.action.filePath || ''

      if (!path) {
          return files
      }

      const f = tab.action.actions.reduce((newF, a) => {
        const fp = path + a.file

        // ensure unique
        if (newF.indexOf(fp) === -1 && files.indexOf(fp) === -1) {
          newF.push(fp)
        }

        return newF
      }, [])

      return files.concat(f)
    }, [])
  }
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabState
}
