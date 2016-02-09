global.chrome = {}

var TabState = require('../ext/tabState')

describe('TabState', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()
  })

  describe('_findIndexById', () => {
    it('returns undefined if nothing found', () => {
      const idx = Tabs._findIndexById(2)
      expect(idx).toBe(undefined)
    })

    it('returns the index of the matching tab state', () => {
      Tabs.state = [{id: 4}, null, undefined, {id: 2}, {id: 5}]
      var idx = Tabs._findIndexById(4)
      expect(idx).toEqual(0)
      idx = Tabs._findIndexById(5)
      expect(idx).toEqual(4)
      expect(Tabs.state[4].id).toEqual(5)
    })
  })

  describe('addState', () => {
    it('creates a new tab state if existing state not found', () => {
      expect(Tabs.state[0]).toBeUndefined()
      Tabs.addState({id: 2, test: 'néw'})
      expect(Tabs.state[0].id).toEqual(2)
      expect(Tabs.state[0].test).toEqual('néw')
    })

    it('replaces existing tab state with new state', () => {
      Tabs.addState({id: 2, test: 'néw'})
      expect(Tabs.state[0].test).toEqual('néw')
      Tabs.addState({id: 2, newtest: 'hî'})
      expect(Tabs.state[0].newtest).toEqual('hî')
      // it gone
      expect(Tabs.state[0].test).toBeUndefined()
    })
  })

  describe('removeState', () => {
    it('removes tab state for given tabId', (done) => {
      Tabs.state = [{id: 1}, {id: 2}, {id: 3}]
      expect(Tabs.state.length).toEqual(3)
      // intercept changed state
      Tabs._changedState = () => {
        expect(Tabs.state.length).toEqual(2)
        expect(Tabs.state[0].id).toEqual(1)
        expect(Tabs.state[1].id).toEqual(3)
        done()
      }
      Tabs.removeState(2)
    })
  })

  describe('_willChangeState', () => {
    it('copies state to previous', () => {
      Tabs.state.push({id: 123, test: 'hî'})
      Tabs.state.push({id: 100, test: 'bläh'})
      expect(Tabs.state.length).toEqual(2)
      expect(Tabs._prevState.length).toEqual(0)
      Tabs._willChangeState()
      Tabs.state.push({id: 1})
      expect(Tabs.state.length).toEqual(3)
      expect(Tabs._prevState.length).toEqual(2)
    })
  })

  describe('_diffState', () => {
    it('diffs state and _prevState', () => {
      expect(Tabs._diffState()).toBe(false)
      Tabs.state.push({id: 123, file: 'hî'})
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice(0, Tabs.state.length)
      expect(Tabs._diffState()).toBe(false)

      Tabs.state.push({id: 12, file: 'hî'})
      expect(Tabs._diffState()).toBe(false)

      Tabs.state.push({id: 1, file: 'hî2'})
      expect(Tabs._diffState()).toBe(true)

      Tabs.state.push({id: 1, file: 'hî22'})
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice(0, Tabs.state.length)
      expect(Tabs._diffState()).toBe(false)

      Tabs._prevState.push({id: 1, file: 'hi22'})
      expect(Tabs._diffState()).toBe(true)

      Tabs.state.push({id: 1, file: 'hi22'})
      expect(Tabs._diffState()).toBe(false)
    })
  })

  describe('_changedState', () => {
    it('calls onChange if there is a difference between states', (done) => {
      Tabs._diffState = () => {
        return true
      }
      Tabs.onChange = () => {
        done()
      }
      Tabs._changedState()
    })

    it('doesn\'t call onChange if there is no new state', () => {
      Tabs._diffState = () => {
        return false
      }
      Tabs.onChange = () => {
        throw('should not be called')
      }
      Tabs._changedState()
    })
  })

})
