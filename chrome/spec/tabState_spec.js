global.chrome = {}

var TabState = require('../ext/tabState')

function createData(state, id, path, files) {
  const r = {
    id: id,
    action: {
      filePath: path,
      actions: []
    }
  }
  files.forEach((f) => {
    r.action.actions.push({ file: f })
  })
  state.push(r)
}

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
    function resetData(t) {
      t.state = []
      t._prevState = []
    }

    it('diffs state and _prevState', () => {
      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 123, '/test/', ['hî'])
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice(0, Tabs.state.length)
      expect(Tabs._diffState()).toBe(false)

      createData(Tabs.state, 12, '/test/', ['hî'])
      expect(Tabs._diffState()).toBe(false)

      createData(Tabs.state, 1, '/test/', ['hî2'])
      expect(Tabs._diffState()).toBe(true)

      createData(Tabs.state, 1, '/test/', ['hî22'])
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice(0, Tabs.state.length)
      expect(Tabs._diffState()).toBe(false)

      createData(Tabs._prevState, 1, '/test/', ['hi22'])
      expect(Tabs._diffState()).toBe(true)

      createData(Tabs.state, 1, '/test/', ['hi22'])
      expect(Tabs._diffState()).toBe(false)
    })

    it('treats filepaths as part of filename', () => {
      createData(Tabs.state, 1, '/path1/', ['test'])
      createData(Tabs._prevState, 1, '/path1/', ['test'])
      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 1, '/path1/', ['test'])
      createData(Tabs._prevState, 1, '/path2/', ['test'])
      expect(Tabs._diffState()).toBe(true)
    })

    it('able to process multiple files', () => {
      createData(Tabs.state, 1, '/path1/', ['test', 'test1', 'blah'])
      createData(Tabs._prevState, 1, '/path1/', ['test', 'test1', 'blah'])
      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 2, '/path2/', ['test', 'test1', 'blah'])
      createData(Tabs._prevState, 2, '/path1/', ['test', 'test1', 'blah'])
      expect(Tabs._diffState()).toBe(true)
      resetData(Tabs)

      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 2, '/path1/', ['test', 'test2', 'blah'])
      createData(Tabs._prevState, 2, '/path1/', ['test', 'test1', 'blah'])
      expect(Tabs._diffState()).toBe(true)
      resetData(Tabs)

      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 2, '/path1/', ['test', 'blah'])
      createData(Tabs._prevState, 2, '/path1/', ['test', 'test1', 'blah'])
      expect(Tabs._diffState()).toBe(true)
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

  describe('renderFiles', () => {
    it('outputs all files needed', () => {
      createData(Tabs.state, 2, '/test1/', ['a', 'b', 'c'])
      createData(Tabs.state, 2, '/test2/path/', ['a-1.txt', 'ôáà.js', 'cś.css'])
      expect(Tabs.renderFiles()).toEqual([
        '/test1/a',
        '/test1/b',
        '/test1/c',
        '/test2/path/a-1.txt',
        '/test2/path/ôáà.js',
        '/test2/path/cś.css'
      ])
    })

    it('ensures unique files', () => {
      createData(Tabs.state, 2, '/test1/', ['a', 'b', 'c'])
      createData(Tabs.state, 1, '/test1/', ['a', 'b', 'c', 'd'])
      expect(Tabs.renderFiles()).toEqual([
        '/test1/a',
        '/test1/b',
        '/test1/c',
        '/test1/d',
      ])
    })
  })

})
