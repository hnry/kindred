var Tabs = chrome.extension.getBackgroundPage().Tabs
chrome.tabs.query({ active: true, currentWindow: true}, init)

function replace(eleId, str) {
  const el = document.getElementById(eleId)
  el.textContent = str
}

function init(tab) {
  if (!tab.length || !tab[0].id) {
    // unable to get the active tab
    // TODO error
  }

  const idx = Tabs._findIndexById(tab[0].id)
  if (typeof idx === 'undefined') {
    // active tab isn't in the TabState ?
    // TODO error
  }

  const state = Tabs.state[idx]

  replace('tab', JSON.stringify(state))
  replace('action-name', state.action.name)

}
