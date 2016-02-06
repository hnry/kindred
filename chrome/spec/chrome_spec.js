global.chrome = {}

var TabState = require('../ext/tabState')
var background = require('../ext/background')

describe('Chrome Extension', () => {

  var Tabs

  beforeEach(() => {
    Tabs = new TabState()
  })

  describe('blah', () => {

    it('test filler', () => {
      background.onUpdated(Tabs)
    })

  })

})
