global.chrome = {}

var TabState = require('../src/tabState')

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

  describe('messages', () => {
    beforeEach(() => {
      Tabs.messages = [
        {id: 1, type: 'x', msg: 'hi hi'},
        {id: 2, type: 'x', msg: 'test'},
        {id: 2, type: 'x', msg: 'hi hi test'},
        {id: 3, type: 'x', msg: 'hi hi'},
        {id: 5, type: 'x', msg: 'hi hi'},
        {id: 8, type: 'x', msg: 'hi hi'}
      ]
    })

    it('messagesRead - reads messages', () => {
      const msgs = Tabs.messagesRead(2)
      expect(msgs.length).toBe(2)
      expect(msgs[0].msg).toBe('test')
      expect(msgs[1].msg).toBe('hi hi test')
    })

    it('messagesRead - does not remove messages when read', () => {
      Tabs.messagesRead(2)
      expect(Tabs.messages.length).toBe(6)
      Tabs.messagesRead(1233)
      expect(Tabs.messages.length).toBe(6)
    })

    it('messagesClear - removes messages for tab id', () => {
      expect(Tabs.messages.length).toBe(6)
      Tabs.messagesClear(2)
      expect(Tabs.messages.length).toBe(4)
      Tabs.messagesClear(1234)
      expect(Tabs.messages.length).toBe(4)
      Tabs.messagesClear(3)
      expect(Tabs.messages.length).toBe(3)
    })
  })

  describe('messagesAdd', () => {
    it('adds message to messages', () => {
      Tabs.messagesAdd(4, {type: 'status', msg:'hi hi'})
      expect(Tabs.messages.length).toBe(1)
      Tabs.messagesAdd(4, {type:'status2', msg:'hi hi2'})
      expect(Tabs.messages.length).toBe(2)
      expect(Tabs.messages[1]).toEqual({ id: 4, type: 'status2', msg: 'hi hi2' })
    })

    it('does not add duplicate messages with the same type', () => {
      Tabs.messagesAdd(4, {type:'status', msg:'hi hi'})
      Tabs.messagesAdd(4, {type:'status', msg:'hi hi'})
      Tabs.messagesAdd(4, {type:'status', msg:'hi hi'})
      Tabs.messagesAdd(4, {type:'status2', msg:'hi hi'})
      Tabs.messagesAdd(4, {type:'status2', msg:'hi hi'})
      expect(Tabs.messages.length).toBe(2)
    })
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

  describe('_refreshFiles', () => {
    it('diffs the current state to figure out files that need to be refreshed', (done) => {
      let count = 0
      Tabs.onRefresh = (files) => {
        count += 1
        if (count == 2) {
          expect(files.length).toBe(1)
          expect(files[0]).toBe('/test/path/test.css')
          done()
        } else if (count == 1) {
          expect(files.length).toBe(2)
        }
      }

      const testData = { action: {
        filePath: '/test/path/',
        actions: [
          { file: 'test.js' },
          { file: 'test.css' }
        ]
      }}

      Tabs.state = []
      Tabs._refreshFiles(testData)

      Tabs.state = [testData]
      Tabs._refreshFiles(testData)

      Tabs.state = [
        { action: { filePath: '/test/path/',
          actions: [
            { file: 'test1.js' },
            { file: 'test1.css' } ]}},
        { action: { filePath: '/test/path/',
          actions: [
            { file: 'test.css' } ]}},
        { action: { filePath: '/test/path/',
          actions: [
            { file: 'test2.js' },
            { file: 'test2.css' } ]}}
      ]

      Tabs._refreshFiles(testData)
    })
  })

  describe('addState', () => {
    it('clears messages for tab id', () => {
      Tabs.messages = [
        {id: 2, msg: 'hi'},
        {id: 3, msg: 'hi'},
        {id: 22, msg: 'hi'},
        {id: 2, msg: 'hi'}
      ]
      Tabs.addState({id: 2})
      expect(Tabs.messages.length).toBe(2)
    })

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

    it('removes any messages for the tabId', () => {
      Tabs.state = [{id: 1}, {id: 2}, {id: 3}]
      Tabs.messages = [{id:2},{id:1},{id:1},{id:3}]
      Tabs.removeState(2)
      expect(Tabs.messages.length).toBe(3)
      Tabs.removeState(1)
      expect(Tabs.messages.length).toBe(1)
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

    it('returns true if previously had state but state becomes empty []', () => {
      createData(Tabs._prevState, 123, '/test/', ['hî'])
      expect(Tabs._diffState()).toBe(true)
    })

    it('diffs state and _prevState', () => {
      expect(Tabs._diffState()).toBe(false)
      createData(Tabs.state, 123, '/test/', ['hî'])
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice()
      expect(Tabs._diffState()).toBe(false)

      createData(Tabs.state, 12, '/test/', ['hî'])
      expect(Tabs._diffState()).toBe(false)

      createData(Tabs.state, 1, '/test/', ['hî2'])
      expect(Tabs._diffState()).toBe(true)

      createData(Tabs.state, 1, '/test/', ['hî22'])
      expect(Tabs._diffState()).toBe(true)

      Tabs._prevState = Tabs.state.slice()
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
