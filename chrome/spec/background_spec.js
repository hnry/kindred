var TabState = require('../ext/tabState')
var background = require('../ext/background')

describe('background', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()

    global.chrome = {
      pageAction: {}
    }
  })

  describe('pack', () => {
    it('', () => {

    })
  })

  describe('sync', () => {
    it('', () => {

    })
  })

  describe('onChange', () => {
    it('', () => {

    })
  })

  describe('chromeOnUpdated', () => {
    it('', () => {

    })
  })

  describe('chromeOnRemoved', () => {
    it('calls removeState and hides chrome icon', (done) => {
      var removeCalled = false
      Tabs.removeState = (tabId) => {
        expect(tabId).toEqual(5)
        removeCalled = true
      }
      chrome.pageAction.hide = (tabId) => {
        expect(tabId).toEqual(5)
        expect(removeCalled).toBe(true)
        done()
      }
      background.chromeOnRemoved(Tabs, 5)
    })
  })

})
