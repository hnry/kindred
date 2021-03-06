import TabState from '../src/tabState'
import background from '../src/background'

describe('background', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()
    global.Tabs = Tabs
    global.chrome = {
      pageAction: {
        show: () => {},
        hide: () => {},
        setIcon: () => {}
      },
      tabs: {
        executeScript: (i, f, cb) => { cb() },
        sendMessage: (i, o, cb) => { cb() }
      },
      storage: {
        sync: {
          get: function(options, cb) {
            // simulate async in looking up storage
            setTimeout(function() {
              cb({ actions: defaultActions })
            }, 1)
          }
        }
      }
    }
  })

  describe('_cmpUrl', () => {
    const cmp = background._cmpUrl

    it('url path is case sensitive', () => {
      expect(cmp('http://example.com/Hi', 'http://example.com/hi')).toBe(false)
    })

    it('protocol matters, http or https', () => {
      expect(cmp('https://example.com', 'http://example.com')).toBe(false)
    })

    it('understands regexp', () => {
      expect(cmp('http://www.example.com/ASsf1', 'w{3}\.example.com/(.*)1'))
    })

    it('understands escaped string', () => {
      expect(cmp('https://www.example.com/Asz1/d2', 'https://www\.example\.com\/Asz[1]\/d2')).toBe(true)
    })
  })

  describe('addTab', () => {
    function testAddTab(tab, action, actionNames, expectTab, done) {
      Tabs.addState = (t) => {
        expect(t).toEqual(expectTab)
        done()
      }
      background.addTab({ tab: tab, actions: action, names: actionNames })
    }

    it('adds even if nothing actionable',
  (done) => {
    const t = {
      id: 123
    }
    const expectTab = {
      id: 123
    }
    const a = [{namePrefix: 'test', nameSuffix: 'hi', actionElementEdit: 'test'}]
    testAddTab(t, a, undefined, expectTab, done)
  })

    it('adds actions', (done) => {
      const t = {
        id: 123,
        action: {}
      }
      const expectTab = {
        id: 123,
        action: {
          actions: [{
            file: 'testgotamatchhi',
            actionElementEdit: 'test1'
          }]
        }
      }
      const actions = [
        {namePrefix: 'test', nameSuffix: 'hi', actionElementEdit: 'test1'}
      ]

      const actionNames = ['gotamatch']
      testAddTab(t, actions, actionNames, expectTab, done)
    })

    it('adds multiple actions', (done) => {
      const t = {
        id: 123,
        action: {}
      }
      const expectTab = {
        id: 123,
        action: {
          actions: [
            {file: 'testgotamatchhi', actionElementEdit: 'test1'},
            {file: 'test--secondmatch.js', actionElementEdit: 'test2'},
            {file: 'testthird.txt', actionElementEdit: 'test3 p'}
          ]
        }
      }
      const actions = [
        {namePrefix: 'test', nameSuffix: 'hi', actionElementEdit: 'test1'},
        {namePrefix: 'test--', nameSuffix: '.js', actionElementEdit: 'test2'},
        {namePrefix: 'test', nameSuffix: '.txt', actionElementEdit: 'test3 p'}
      ]

      const actionNames = ['gotamatch', 'secondmatch', 'third']
      testAddTab(t, actions, actionNames, expectTab, done)
    })
  })

  describe('_makeTabData', () => {
    // technically this test is calling addTab
    it('non-actionable tab data', () => {
      background._makeTabData(200, { url: 'http://test.com/hï' }, defaultActions[0], false)

      expect(Tabs.state[0]).toEqual({
        id: 200,
        url: 'http://test.com/hï',
        action: {
          name: 'Test action',
          actions: []
        }
      })
    })

    // technically this test is calling addTab
    it('skips actionable if no fileDir', () => {
      const t = {
        id: 200,
        url: 'http://test.com/hï',
        action: {
          name: 'Test actionn',
          actions: []
        }
      }

      const testData = {
        id: 200,
        url: 'http://test.com/hï',
        testNames: ['testNamé'],
        action: defaultActions[1]
      }
      background._makeTabData(testData.id, { url: testData.url }, testData.action, true)
      expect(Tabs.state[0]).toEqual(t)
    })

    function testActionable(testData, fileDir, expectT, done) {
      chrome.tabs.sendMessage = ((i, o) => {
        expect(o).toEqual(expectT)
        done()
      })
      if (fileDir) {
        testData.action.filePath = fileDir
      }
      background._makeTabData(testData.id, { url: testData.url }, testData.action, true)
    }

    it('actionable tab data', (done) => {
      const t = {
        type: 'name',
        tab: {
          id: 210,
          url: 'http://test.com/#hï',
          action: {
            name: 'Test actiön 3',
            filePath: '/test/path/',
            actions: []
          }
        },
        actions: defaultActions[2].actions
      }
      const testData = {
        id: 210,
        url: 'http://test.com/#hï',
        testNames: ['testNamé', 'testcssName', 'testHTML'],
        action: defaultActions[2]
      }
      testActionable(testData, '/test/path/', t, done)
    })
  })

  describe('sync', () => {
    it('forwards file data to correct tabs', (done) => {
      var count = 1
      let testId
      let testData
      chrome.tabs.sendMessage = (id, data) => {
        if (count == 1) {
          testId = 1
          testData = { id: 1, type: 'edit', selector: '$selector', text: 'hî'}
        } else if (count == 2) {
          testId = 201
          testData = { id: 201, type: 'edit', selector: '$selector', text: 'hî'}
        } else if (count == 3) {
          testId = 12
          testData = { id: 12, type: 'edit', selector: 'element', text: 'hîi'}
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

      background.onChange(Tabs, Tabs.state)

      expect(dcCalled).toEqual(true)
      expect(background.native.port).toEqual(null)
    })
  })

  describe('chromeOnUpdated', () => {
    it('removes from tab state if update changes previously match', (done) => {
      Tabs.state.push({id: 5})
      expect(Tabs.state.length).toEqual(1)
      background.chromeOnUpdated(5, { status: 'complete' }, { url: 'test no match' })

      setTimeout(() => {
        expect(Tabs.state.length).toEqual(0)
        done()
      }, 10)
    })

    it('calls TabState to add on match', (done) => {
      Tabs.addState = (tab) => {
        expect(tab.id).toEqual(700)
        done()
      }
      background.chromeOnUpdated(700, { status: 'complete' }, { url: defaultActions[0].url })
    })
  })

  describe('chromeOnRemoved', () => {
    it('calls TabState#removeState', (done) => {
      var removeCalled = false
      Tabs.removeState = (tabId) => {
        expect(tabId).toEqual(5)
        done()
      }
      background.chromeOnRemoved(5)
    })
  })

})
