'use strict';
//    chrome.pageAction.setTitle({tabId: tabId, title: 'testing'})
//    chrome.pageAction.setIcon({tabId: tabId, path: 'error.png'})
const native = {
  hostname: 'com.kindred_edit.native',
  port: null,
  send(msg) {
    this.port.postMessage(msg)
  },
  connect(msgHandler) {
    this.port = chrome.runtime.connectNative(this.hostname)
    this.port.onMessage.addListener(msgHandler)
  }
}

/**
 * native incoming message handler
 * for handling file data
 * message is JSON { file: string, data: string}
 *
 * sends each `message` to the corresponding tab
 *
 * @param  {Object} state    current TabState
 * @param  {Object} msg object JSON of incoming message
 *
 * Access: r TabState, native
 */
const sync = (state, msg) => {
  state.forEach((tabData) => {
    const path = tabData.action.filePath
    tabData.action.actions.forEach((a) => {
      if (path + a.file === msg.file) {
        chrome.tabs.sendMessage(tabData.id, { type: 'edit', selector: a.actionElementEdit, text: msg.data})
      }
    })
  })
}

/**
 * Handler passed to TabState on initiation
 * called everytime there are changes
 * to TabState
 * (Changes being files needed)
 *
 * All things native starts (and stops) here
 *
 * @param  {Object} native  The global native object
 * @param  {Object} Tabs    An instance of TabState
 * @param  {[type]} state TabState#state
 *
 * Access: r TabState, native
 */
function onChange(native, Tabs, state) {
  const payload = { files: Tabs.renderFiles() }
  if (payload.files.length === 0) {
    if (native.port != null) {
      native.port.disconnect() // exits native
      native.port = null
    }
    return
  }

  if (native.port == null) {
    native.connect(sync.bind(undefined, state))
  }
  native.send(payload)
}

function _cmpUrl(url, aUrl) {
  if (!aUrl.trim()) {
    return false
  }
  const r = new RegExp(aUrl)
  return r.test(url)
}

// Access: w TabState, chrome
//
// data = {tab, actions, names}
function addTab(data) {
  if (data.names) {
    data.tab.action.actions = data.actions.map((a, idx) => {
      return {
        file: a.namePrefix + data.names[idx] + a.nameSuffix,
        actionElementEdit: a.actionElementEdit
      }
    })
  }

  Tabs.addState(data.tab)
  chrome.pageAction.show(data.tab.id)
}

function _makeTabData(id, tab, action, actionable) {
  const t = {
    id: id,
    url: tab.url,
    action: {
      name: action.name,
      actions: []
    }
  }

  // TODO should show warning if no filePath, must be set in settings
  if (actionable && action.filePath) {
    t.action.filePath = action.filePath

    chrome.tabs.executeScript(id, {file: 'jquery.js'}, () => {
      chrome.tabs.executeScript(id, {file: 'action.js'}, () => {
        chrome.tabs.sendMessage(id, { type: 'name', tab: t, actions: action.actions })
      })
    })

  } else {
    addTab({ tab: t })
  }
}

function getActions(callback) {
  chrome.storage.sync.get({
    actions: defaultActions
  }, (storage) => {
    callback(storage.actions)
  })
}

// 1. figures out if existing tab state is stale and removes it
// 2. sees if tab is a match
// 3. figures out if match is 'actionable'; must get file path
// 4. generates a tab state object based on 2,3
// 5. adds or updates tab state for this tab
//
// chrome, actions
const chromeOnUpdated = (tabId, changedProps, tab) => {
  if (changedProps.status !== 'complete') {
    return
  }
  let matched = false

  function add(action, actionable) {
    matched = true
    _makeTabData(tabId, tab, action, actionable)
  }

  getActions((actions) => {
    // TODO visually show which action gets matched
    for (let i = 0, l = actions.length; i < l; i++) {
      if (_cmpUrl(tab.url, actions[i].actionUrl)) {
        add(actions[i], true)
        break;
      }
      if (_cmpUrl(tab.url, actions[i].url)) {
        add(actions[i], false)
        break;
      }
    }

    if (Tabs._findIndexById(tabId) !== undefined && !matched) {
      chrome.pageAction.hide(tabId)
      Tabs.removeState(tabId)
    }
  })
}

// w -> Tabs, chrome
const chromeOnRemoved = (tabId) => {
  Tabs.removeState(tabId)
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    native,
    sync,
    addTab,
    onChange,
    _cmpUrl,
    _makeTabData,
    chromeOnUpdated,
    chromeOnRemoved
  }
}
