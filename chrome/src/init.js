// if not for testing, setup for chrome
  var Tabs = new TabState(onChange.bind(undefined, native))
  chrome.tabs.onUpdated.addListener(chromeOnUpdated)
  chrome.tabs.onRemoved.addListener(chromeOnRemoved)
  chrome.runtime.onMessage.addListener(addTab)
