var TabState = require('../ext/tabState')
var background = require('../ext/background')
var testActions = require('./support/actions')

function getTestActions() {
  return testActions
}

describe('background', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()

    global.chrome = {
      pageAction: {
        show: () => {},
        hide: () => {}
      }
    }
  })

  describe('_cmpUrl', () => {
    it('', () => {
      pending()
    })
  })

  describe('_makeTabData', () => {
    it('', () => {
      pending()
    })
  })

  describe('pack', () => {
    it('', () => {
      pending()
    })
  })

  describe('sync', () => {
    it('', () => {
      pending()
    })
  })

  describe('onChange', () => {
    it('', () => {
      pending()
    })
  })

  describe('chromeOnUpdated', () => {
    it('removes from tab state if update changes previously match', () => {
      background.getActions = () => {
        return testActions
      }
      Tabs.state.push({id: 5})
      background.chromeOnUpdated(Tabs, getTestActions, 5, {}, { url: 'test' })
      expect(Tabs.state.length).toEqual(0)
    })

    it('calls TabState to add on match', (done) => {
      Tabs.addState = (tab) => {
        expect(tab.id).toEqual(700)
        done()
      }
      background.chromeOnUpdated(Tabs, getTestActions, 700, { url: testActions[0].url }, { url: testActions[0].url })
    })

    it('matches action url, and figures out file path', () => {
      pending()
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
