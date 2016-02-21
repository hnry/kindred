'use strict';

/*
  State is either changed through addState or removeState

  Any changes (files needed) are handled by onChange (passed in on initiation)

  Any files that need to be refreshed are handled by onRefresh
 */
class TabState {
  constructor(onChange, onRefresh) {
    // stores TabData (which is just a plain object holding tab info)
    this.state = []
    this._prevState = []

    // stores messages to pass to UI (popup.js) for each tab
    // { tabId, type (error or status), msg }
    this.messages = []

    this.onChange = onChange || function() {}
    this.onRefresh = onRefresh || function() {}
  }

  /**
   * read stored messages and deletes them after
   * @param  {Number} tabId tab id
   * @return {Array[Object]}       array of messages
   */
  messagesRead(tabId) {
    const r = []
    this.messages.forEach((message, idx) => {
      if (message.id == tabId) {
        r.push(message)
        this.messages[idx] = null
      }
    })
    this.messages = this.messages.filter((msg, idx) => {
      return msg !== null
    })
    return r
  }

  /**
   * adds message to messages store
   * @param  {Number} tabId tab id
   * @param  {String} type  message type
   * @param  {String} msg   message
   */
  messagesAdd(tabId, type, msg) {
    this.messages.push({ id: tabId, type, msg })
  }

  /**
   * returns the index in state of a tabId
   * @param  {Number} id tab id
   * @return {Number or undefined}   Index of tabId in state or undefined
   */
  _findIndexById(id) {
    for (let i = 0, l = this.state.length; i < l; i++) {
      const t = this.state[i]
      if (t && t.id == id) {
        return i
      }
    }
    return undefined
  }

  /**
   * called by addState()
   * solves issues #1
   *
   * refreshes already known files that get triggered
   * by addState() since a browser refresh happens
   * and file data is not stored anywhere, so native
   * needs to know to re-read the file
   * since native does not re-read a file that has
   * not changed since last read
   * @param  {Object} tabData TabData
   */
  _refreshFiles(tabData) {
    const refresh = this.renderFiles([tabData])
    const f = this.renderFiles(this.state)
    // anything in f that is also in refresh
    // needs to be 'refreshed'
    const r = f.filter((file) => {
      return refresh.filter((newfile) => {
        return file === newfile
      }).length
    })

    this.onRefresh(r)
  }

  addState(tabData) {
    const idx = this._findIndexById(tabData.id)
    this._willChangeState()

    if (idx !== undefined) {
      // figure out if any files need refreshing
      this._refreshFiles(tabData)
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
      this.messagesRead(tabId)

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
      let path = tab.action && tab.action.filePath || ''

      if (!path) {
          return files
      }

      // fix all possible pathing issues here TODO
      if (path[path.length - 1] !== '/') {
        path = path + '/'
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
