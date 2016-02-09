/*
  actions are user configurable JSON that tells what sites should trigger
  this extension
  and how to interact with those sites
 */
const actions = [
  {
    // any name to identify this module
    name: 'Test module',
    // url that triggers extension icon on address bar
    url: 'https://www.google.com/?gws_rd=ssl',
    // url that has a editable input to hook into
    actionUrl: '',
    // jquery selector to find the editable element on actionUrl
    // eg: '#id' , 'td tr p'
    actionElementEdit: '',
    // jquery selector to determine possible filename for this action
    actionElementName: ''
  }
]

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
const onChange = (nConnect, nSend, actions, state) => {
  const payload = pack(state)
  if (payload.files.length == 0) {
    return
  }

  if (NativeRunning) {
    nSend(payload)
  } else {
    nConnect(sync.bind(undefined, state, actions))
    nSend(payload)
  }
}

// 1. figures out if existing tab state is stale and removes it
// 2. sees if tab is a match
// 3. figures out if match is 'actionable'; must get file path
// 4. generates a tab state object based on 2,3
// 5. adds or updates tab state
//
// w -> Tabs, chrome, actions
const chromeOnUpdated = (Tabs, tabId, changedProps, tab) => {
  // see if this tabId is already known
  const t = Tabs.get(tabId)
  let matched = false

  for (let i = 0, l = actions.length; i < l; i++) {
    // TODO the hostname information should be normalized to lower case
    // while keeping the uri case intact
    if (actions[i].url == tab.url) {
      // if we do not know about this tab, add it
      if (!t) {
        Tabs.add(tabId, tab.url, actions[i])
        chrome.pageAction.show(tabId)
      } else {
        Tabs.update(tabId, tab.url, actions[i])
      }
      matched = true
      break;
    }
  }

  // if Tabs knows about this tabId, but no match, the URL and
  // Tabs should no longer know about this tabId
  if (t && !matched) {
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
  module.exports.chromeOnUpdated = chromeOnUpdated
  module.exports.chromeOnRemoved = chromeOnRemoved
} else {
// if not for testing, init things for chrome
  const t = new TabState(onChange.bind(undefined, NativeConnect, NativeSend, actions))
  chrome.tabs.onUpdated.addListener(chromeOnUpdated.bind(undefined, t))
  chrome.tabs.onRemoved.addListener(chromeOnRemoved.bind(undefined, t))
}
