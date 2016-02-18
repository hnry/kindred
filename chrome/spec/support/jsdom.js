global.document = require('jsdom').jsdom('')
global.window = document.defaultView
global.navigator = window.navigator

global.chrome = {
  storage: {
    sync: {
      set: function() {},
      get: function() {}
    }
  }
}
