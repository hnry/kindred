global.chrome = {}

var TabState = require('../ext/tabState')

describe('TabState', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()
  })

  describe('get', () => {
    it('returns undefined if nothing found', () => {
      const t = Tabs.get(5)
      expect(t).toBe(undefined)
    })

    it('retrieves tab state', () => {
      Tabs._tabs = [{id: 4}, null, undefined, {id: 2}, {id: 5}]
      const t = Tabs.get(2)
      expect(t.id).toEqual(2)
    })
  })

  describe('_getIndex', () => {
    it('returns undefined if nothing found', () => {
      const t = Tabs._getIndex(2)
      expect(t).toBe(undefined)
    })

    it('returns the index of the matching tab state', () => {
      Tabs._tabs = [{id: 4}, null, undefined, {id: 2}, {id: 5}]
      var t = Tabs._getIndex(4)
      expect(t).toEqual(0)
      t = Tabs._getIndex(5)
      expect(t).toEqual(4)
      expect(Tabs._tabs[4].id).toEqual(5)
    })
  })

  describe('set', () => {
    it('creates a new tab state if existing state not found', () => {
      expect(Tabs._tabs[0]).toBeUndefined()
      Tabs.set(2, {id: 2, test: 'néw'})
      expect(Tabs._tabs[0].id).toEqual(2)
      expect(Tabs._tabs[0].test).toEqual('néw')
    })

    it('replaces existing tab state with new state', () => {
      Tabs.set(2, {id: 2, test: 'néw'})
      expect(Tabs._tabs[0].test).toEqual('néw')
      Tabs.set(2, {id: 2, newtest: 'hî'})
      expect(Tabs._tabs[0].newtest).toEqual('hî')
      // it gone
      expect(Tabs._tabs[0].test).toBeUndefined()
    })
  })

  describe('add', () => {
    it('', () => {

    })
  })

  describe('update', () => {
    it('', () => {

    })
  })

  describe('remove', () => {
    it('', () => {

    })
  })

  describe('subscribe', () => {
    it('adds a subscriber', (done) => {
      Tabs.subscribe(() => {})
      Tabs.subscribe(() => {})
      Tabs.subscribe(() => {
        done()
      })
      expect(Tabs._subscribers.length).toEqual(3)
      Tabs._subscribers[2]()
    })
  })

  describe('publish', () => {
    it('calls all subscribers with current tab state', (done) => {
      Tabs._tabs = [1, 2, 3, 4]
      Tabs._subscribers.push(() => {})
      Tabs._subscribers.push(() => {})
      Tabs._subscribers.push((tabState) => {
        expect(tabState.length).toEqual(4)
        done()
      })
      Tabs.publish()
    })
  })

  describe('updateSync', () => {
    it('', () => {

    })
  })

})
