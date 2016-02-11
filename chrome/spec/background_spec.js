var TabState = require('../ext/tabState')
var background = require('../ext/background')
var testActions = require('./support/actions')

function getTestActions(callback) {
  callback(testActions)
}

describe('background', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()

    global.chrome = {
      pageAction: {
        show: () => {},
        hide: () => {}
      },
      tabs: {
        executeScript: (i, f, cb) => { cb() },
        sendMessage: (i, o, cb) => { cb() }
      }
    }
  })

  describe('_cmpUrl', () => {
    it('', () => {
      pending()
    })
  })

  describe('_makeTabData', () => {
    it('non-actionable tab data', (done) => {
      const cb = (t) => {
        expect(t).toEqual({
          id: 200,
          url: 'http://test.com/hï',
          action: {
            name: 'Test action',
            actions: []
          }
        })
        done()
      }

      background._makeTabData(200, { url: 'http://test.com/hï' }, testActions[0], false, cb)
    })

    function testActionable(testData, fileDir, expectT, done) {
      chrome.tabs.sendMessage = ((i, o, callback) => {
        callback(testData.testNames)
      })
      if (fileDir) {
        testData.action.filePath = fileDir
      }
      const cb = (t) => {
        expect(t).toEqual(expectT)
        done()
      }
      background._makeTabData(testData.id, { url: testData.url }, testData.action, true, cb)
    }

    it('skips actionable if no fileDir', (done) => {
      const t = {
        id: 200,
        url: 'http://test.com/hï',
        action: {
          name: 'Test action 2',
          actions: []
        }
      }

      const testData = {
        id: 200,
        url: 'http://test.com/hï',
        testNames: ['testNamé'],
        action: testActions[1]
      }
      testActionable(testData, '', t, done)
    })

    it('actionable tab data', (done) => {
      const t = {
        id: 210,
        url: 'http://test.com/hï',
        action: {
          name: 'Test action 2',
          filePath: '/test/path/',
          actions: [
            { file: 'example-testNamé.js', actionElementEdit: '.blah p'}
          ]
        }
      }
      const testData = {
        id: 210,
        url: 'http://test.com/hï',
        testNames: ['testNamé'],
        action: testActions[1]
      }
      testActionable(testData, '/test/path/', t, done)
    })

    it('ignores invalid names & waits for valid name')

    it('multiple actionable tab data', (done) => {
      const t = {
        id: 210,
        url: 'http://test.com/#hï',
        action: {
          name: 'Test actiön 3',
          filePath: '/test/path/',
          actions: [
            { file: 'tèst-testNamé.js', actionElementEdit: '.test-t a p' },
            { file: 'tèst-testcssName.css', actionElementEdit: '.test-t a b' },
            { file: 'htmltestHTML.html', actionElementEdit: '.test-t a t' }
          ]
        }
      }
      const testData = {
        id: 210,
        url: 'http://test.com/#hï',
        testNames: ['testNamé', 'testcssName', 'testHTML'],
        action: testActions[2]
      }
      testActionable(testData, '/test/path/', t, done)
    })
  })

  describe('sync', () => {
    it('forwards file data to correct tabs', (done) => {
      var count = 1
      chrome.tabs.sendMessage = (id, data) => {
        if (count == 1) {
          testId = 1
          testData = {type: 'edit', selector: '$selector', text: 'hî'}
        } else if (count == 2) {
          testId = 201
          testData = { type: 'edit', selector: '$selector', text: 'hî'}
        } else if (count == 3) {
          testId = 12
          testData = { type: 'edit', selector: 'element', text: 'hîi'}
          done()
        }
        expect(id).toBe(testId)
        expect(data).toEqual(testData)
        count += 1
      }
      Tabs.state = [
        { id: 1, action: { filePath: '/path/', actions: [{ actionElementEdit: '$selector', file: 'fīlé.txt' }] }},
        { id: 201, action: { filePath: '/path/', actions: [{ actionElementEdit: '$selector', file: 'fīlé.txt' }] }},
        { id: 12, action: { filePath: '/path1/', actions: [{ actionElementEdit: 'element', file: 'test.txt' }] }},
      ]

      // does 2 counts since 2 tabs accept this file
      background.sync(Tabs.state, {file:'/path/fīlé.txt', data:'hî'})

      // goes nowhere, no match
      background.sync(Tabs.state, {file:'/path/unknown_file.txt', data:'hîi'})

      // 3rd count
      background.sync(Tabs.state, {file:'/path1/test.txt', data:'hîi'})
    })
  })

  describe('onChange', () => {
    it('stops native when state files is empty', () => {
      var dcCalled = false
      Tabs.renderFiles = () => {
        return []
      }
      background.native.port = {
        disconnect: () => {
          dcCalled = true
        }
      }

      background.onChange(background.native, Tabs, Tabs.state)

      expect(dcCalled).toEqual(true)
      expect(background.native.port).toEqual(null)
    })
  })

  describe('chromeOnUpdated', () => {
    it('removes from tab state if update changes previously match', () => {
      background.getActions = () => {
        return testActions
      }
      Tabs.state.push({id: 5})
      background.chromeOnUpdated(Tabs, getTestActions, 5, { status: 'complete' }, { url: 'test' })
      expect(Tabs.state.length).toEqual(0)
    })

    it('calls TabState to add on match', (done) => {
      Tabs.addState = (tab) => {
        expect(tab.id).toEqual(700)
        done()
      }
      background.chromeOnUpdated(Tabs, getTestActions, 700, { status: 'complete' }, { url: testActions[0].url })
    })

    it('supports regex urls', () => {
      pending()
    })
  })

  describe('chromeOnRemoved', () => {
    it('calls TabState#removeState', (done) => {
      var removeCalled = false
      Tabs.removeState = (tabId) => {
        expect(tabId).toEqual(5)
        done()
      }
      background.chromeOnRemoved(Tabs, 5)
    })
  })

})
