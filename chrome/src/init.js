var Tabs = new TabState(onChange, onRefresh)
chrome.tabs.onUpdated.addListener(chromeOnUpdated)
chrome.tabs.onRemoved.addListener(chromeOnRemoved)
chrome.runtime.onMessage.addListener(addTab)
