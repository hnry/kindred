// jsdom
global.document = require('jsdom').jsdom('')
global.window = document.defaultView
global.navigator = window.navigator

// default actions
global.defaultActions = require('./actions')

// mock for chrome api
global.chrome = {
  storage: {
    sync: {
      set: function() { console.log('save') },
      get: function(options, cb) {
        // simulate async in looking up storage
        setTimeout(function() {
          cb({ actions: defaultActions })
        }, 1)
      }
    }
  }
}

// react
global.React = require('react')
global.ReactDOM = require('react-dom')
