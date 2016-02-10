const NativeRunning = false
const NativeHostname = 'com.kindred_edit.nmh'

function NativeSend(msg) {
  chrome.runtime.sendNativeMessage(NativeHostname, msg)
}

function NativeConnect(responseHandler) {
  const port = chrome.runtime.connectNative(NativeHostname)
  port.onMessage.addListener(responseHandler)
}

/**
 * native incoming message handler
 * for handling file data
 * message is JSON { file: string, data: string}
 *
 * sends each `message` to the corresponding tab
 *
 * @param  Object state    current TabState
 * @param  Object connData object JSON of incoming message
 *
 * Access: r TabState, native
 */
const sync = (state, connData) => {
  state.forEach((tabData) => {
    const path = tabData.action.path
    tabData.action.actions.forEach((a) => {
      if (path + a.file === connData.file) {
        chrome.tabs.sendMessage(tabData.id, { type: 'edit', selector: a.actionElementEdit, text: connData.data})
      }
    })
  })
}

/**
 * Goes over a TabState figuring out what files
 * will be needed (for native)
 * Outputs JSON { files: [] }
 * @param  Object state current TabState
 * @return Object       JSON object to be sent to native
 *
 * Access: r TabState
 */
const pack = (state) => {
  const payload = { files: [] }
  state.forEach((tab, idx) => {
    if (tab && tab.file) {
      payload.files.push(tab.file)
    }
  })
  return payload
}

// brokers a bunch of stuff (sets up dependencies)
// packs() outgoing data then sets up sync()
// for incoming data
//
// native
const onChange = (nConnect, nSend, getActions, state) => {
  const payload = pack(state)
  if (payload.files.length == 0) {
    return
  }

  if (NativeRunning) {
    nSend(payload)
  } else {
    nConnect(sync.bind(undefined, state))
    nSend(payload)
  }
}

function _cmpUrl(url, aUrl) {
  return url === aUrl
}

function _makeTabData(id, tab, action, actionable, callback) {
  // TODO support invalid actionElementName & waiting for valid names
  const t = {
    id: id,
    url: tab.url,
    action: {
      name: action.name,
      actions: []
    }
  }

  // TODO should show warning if no fileDir, must be set in settings
  if (actionable && action.fileDir) {
    t.action.path = action.fileDir

    chrome.tabs.executeScript(id, {file: 'jquery.js'}, () => {
      chrome.tabs.executeScript(id, {file: 'action.js'}, () => {
        chrome.tabs.sendMessage(id, { type: 'name', actions: action.actions }, (response) => {
          t.action.actions = action.actions.map((a, idx) => {
            return {
              file: a.namePrefix + response[idx] + a.nameSuffix,
              actionElementEdit: a.actionElementEdit
            }
          })
          callback(t)
        })
      })
    })
  } else {
    callback(t)
  }
}

function getActions(callback) {
  let a = defaultActions || []
  chrome.storage.sync.get('actions', (actions) => {
    callback(a)
  })
}

// 1. figures out if existing tab state is stale and removes it
// 2. sees if tab is a match
// 3. figures out if match is 'actionable'; must get file path
// 4. generates a tab state object based on 2,3
// 5. adds or updates tab state for this tab
//
// w -> Tabs, chrome, actions
const chromeOnUpdated = (Tabs, getActions, tabId, changedProps, tab) => {
  if (changedProps.status !== 'complete') {
    return
  }
  let matched = false

  function add(action, actionable) {
    matched = true

    _makeTabData(tabId, tab, action, actionable, (tabData) => {
      Tabs.addState(tabData)
      chrome.pageAction.show(tabId)
    })
  }

  getActions((actions) => {
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
const chromeOnRemoved = (Tabs, tabId) => {
  Tabs.removeState(tabId)
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports.NativeRunning = NativeRunning
  module.exports.sync = sync
  module.exports.pack = pack
  module.exports.onChange = onChange
  module.exports._cmpUrl = _cmpUrl
  module.exports._makeTabData = _makeTabData
  module.exports.chromeOnUpdated = chromeOnUpdated
  module.exports.chromeOnRemoved = chromeOnRemoved
} else {
// if not for testing, init things for chrome
  const t = new TabState(onChange.bind(undefined, NativeConnect, NativeSend, getActions))
  chrome.tabs.onUpdated.addListener(chromeOnUpdated.bind(undefined, t, getActions))
  chrome.tabs.onRemoved.addListener(chromeOnRemoved.bind(undefined, t))
}
