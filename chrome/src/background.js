/*
  modules are user configurable JSON that tells what sites should trigger
  this extension
  and how to interact with those sites
 */
const configModules = [
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

// broker (between tab state and native messaging)
const broker = (Tabs, state) => {
  const payload = { files: [] }

  state.forEach((tab, idx) => {
    if (tab && tab.file) {
      payload.files.push(tab.file)

      // TODO what happens if we send a message before connecting?
      if (NativeRunning) {
        NativeSend(payload)
      }
    }
  })

  if (!NativeRunning && payload.files.length > 0) {
    NativeConnect((msg) => {
      Tabs.updateSync(msg)
    })
    NativeSend(payload)
  }
}

// chrome
const onUpdated = (Tabs, tabId, changedProps, tab) => {
  // see if this tabId is already known
  const t = Tabs.get(tabId)
  let matched = false

  for (let i = 0, l = configModules.length; i < l; i++) {
    // TODO the hostname information should be normalized to lower case
    // while keeping the uri case intact
    if (configModules[i].url == tab.url) {
      // if we do not know about this tab, add it
      if (!t) {
        Tabs.add(tabId, tab.url, configModules[i])
      } else {
        Tabs.update(tabId, tab.url, configModules[i])
      }
      matched = true
      break;
    }
  }

  // if Tabs knows about this tabId, but no match, the URL and
  // Tabs should no longer know about this tabId
  if (t && !matched) {
    Tabs.remove(tabId, false)
  }
}

const onRemoved = (Tabs, tabId) => {
  Tabs.remove(tabId, true)
}

// export stuff for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports.NativeRunning = NativeRunning
  module.exports.broker = broker
  module.exports.onUpdated = onUpdated
  module.exports.onRemoved = onRemoved
} else {
// if not for testing, init things for chrome
  const t = new TabState()
  t.subscribe(broker.bind(undefined, t))
  chrome.tabs.onUpdated.addListener(onUpdated.bind(undefined, t))
  chrome.tabs.onRemoved.addListener(onRemoved.bind(undefined, t))
}
