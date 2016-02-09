const NativeRunning = false
const NativeHostname = 'com.kindred_edit.nmh'

function NativeSend(msg) {
  chrome.runtime.sendNativeMessage(NativeHostname, msg)
}

function NativeConnect(responseHandler) {
  const port = chrome.runtime.connectNative(NativeHostname)
  port.onMessage.addListener(responseHandler)
}

// processes incoming native messages
// and syncs tabs that need the data
//
// r -> Tabs, actions, chrome
const sync = (state, actions, fileData) => {

}

// creates a obj literal for JSON request to
// native.
// contains all file information
//
// r -> Tabs
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
    nConnect(sync.bind(undefined, state, getActions))
    nSend(payload)
  }
}

function _cmpUrl(url, aUrl) {
  return url === aUrl
}

function _makeTabData(id, tab, action, actionable) {
  return {id: id}
}

function _getActionName() {

}

function getActions() {

}

// 1. figures out if existing tab state is stale and removes it
// 2. sees if tab is a match
// 3. figures out if match is 'actionable'; must get file path
// 4. generates a tab state object based on 2,3
// 5. adds or updates tab state for this tab
//
// w -> Tabs, chrome, actions
const chromeOnUpdated = (Tabs, getActions, tabId, changedProps, tab) => {
  let matched = false
  const actions = getActions()

  function add(action, actionable) {
    const tabData = _makeTabData(tabId, tab, action, actionable)
    matched = true
    Tabs.addState(tabData)
    chrome.pageAction.show(tabId)
  }

  for (let i = 0, l = actions.length; i < l; i++) {
    if (_cmpUrl(tab.url, actions[i].url)) {
      add(actions[i], false)
      break;
    }
    if (_cmpUrl(tab.url, actions[i].actionUrl)) {
      add(actions[i], true)
      break;
    }
  }

  if (Tabs._findIndexById(tabId) !== undefined && !matched) {
    Tabs.removeState(tabId)
  }
}

// w -> Tabs, chrome
const chromeOnRemoved = (Tabs, tabId) => {
  Tabs.removeState(tabId)
  // no longer need icon for chrome tabs removed
  chrome.pageAction.hide(tabId)
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
