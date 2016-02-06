/*
  modules are user configurable JSON that tells what sites should trigger
  this extension
  and how to interact with those sites
 */
const modules = [
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

const Tabs = new TabState()
const NativeRunning = false
const NativeHostname = 'com.qtop.nmh'

function NativeSend(msg) {
  chrome.runtime.sendNativeMessage(NativeHostname, msg)
}

function NativeConnect(responseHandler) {
  const port = chrome.runtime.connectNative(NativeHostname)
  port.onMessage.addListener(responseHandler)
}

// broker (between tab state and native messaging)
Tabs.subscribe((state) => {
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
})

// chrome
chrome.tabs.onUpdated.addListener((tabId, changedProps, tab) => {
  // see if this tabId is already known
  const t = Tabs.get(tabId)
  let matched = false

  for (let i = 0, l = modules.length; i < l; i++) {
    // TODO the hostname information should be normalized to lower case
    // while keeping the uri case intact
    if (modules[i].url == tab.url) {
      // if we do not know about this tab, add it
      if (!t) {
        Tabs.add(tabId, tab.url, modules[i])
      } else {
        Tabs.update(tabId, tab.url, modules[i])
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
})

chrome.tabs.onRemoved.addListener((tabId) => {
  Tabs.remove(tabId, true)
})
