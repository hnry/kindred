var Tabs = chrome.extension.getBackgroundPage().Tabs
chrome.tabs.query({ active: true, currentWindow: true}, init)

function elementText(eleId, txt) {
  const el = document.getElementById(eleId)
  el.textContent = txt
}

function elementAppend(eleId, txt) {
  const el = document.getElementById(eleId)
  const li = document.createElement('div')
  li.textContent = txt
  el.appendChild(li)
}

function init(tab) {
  if (!tab.length || !tab[0].id) {
    elementText('status', 'Unexpected error: Could not find active Chrome tab')
    return
  }

  const tabId = tab[0].id

  const idx = Tabs._findIndexById(tabId)
  if (typeof idx === 'undefined') {
    elementText('status', 'Unexpected error: Could not find data associated with active tab')
    return
  }

  const state = Tabs.state[idx]

  //elementText('debug', JSON.stringify(state))

  // the rule that is currently triggered
  elementText('action-name', state.action.name)

  if (state.action.actions.length) {
    // files for this rule, only populated if actionable
    const wrapper = document.getElementById('files-div')
    wrapper.className = 'rule'

    const noActions = document.getElementById('no-actions')
    noActions.className = 'default-hidden'

    state.action.actions.forEach((a) => {
      elementAppend('files', state.action.filePath + a.file)
    })
  }

  const msgs = Tabs.messagesRead(tabId)
  if (msgs.length) {
    // any error msgs associated tab
    const wrapper = document.getElementById('status-div')
    wrapper.className = 'rule'
    Tabs.messagesRead(tabId).forEach((msg) => {
      elementAppend('status', msg)
    })
  }
}
