console.log('kindred extension loaded');

var strategies = {
  codemirror: {
    detect: function(el) {
      // scan for CodeMirror container
      // and if `el` is inside container then it is CodeMirror
      var result;
      var codemirror = Sizzle('.CodeMirror');
      var index = 0;
      if (codemirror.length) {
        var result = codemirror.some(function(cmEl, idx) {
          var n = el.parentNode;
          while (n !== null) {
            if (n === cmEl) {
              index = idx;
              return true;
            }
            n = n.parentNode;
          }
          return false;
        });
      }

      if (result) {
        return { name: 'codemirror', run: this.runner.bind(undefined, codemirror[index]) };
      }
    },
    runner: function(el, text) {
      // unfortunately codemirror does not provide an easy way to interface
      // with it through the DOM, so resorting to this...
      // 
      // Cannot use select all keyboard event because of Chrome bug
      // https://bugs.chromium.org/p/chromium/issues/detail?id=589339
      // 
      // Simulate mouse wheel up to "reset" back to 0 position
      // Then mouse drag downward to simulate select all
      var elScroll = Sizzle('.CodeMirror-scroll', el)[0];
      el = Sizzle('textarea', el)[0];
      //var elScroll = el.getElementsByClassName('CodeMirror-scroll')[0];

      // short hand mouse event helper
      function mouse(el, event, x, y) {
        if (event === 'mousewheel') {
          var event = new WheelEvent(event, {
            button: 0,
            which: 1,
            wheelDeltaX: x,
            wheelDeltaY: y
          });
        } else {
          var event = new MouseEvent(event, {
            button: 0,
            which: 1,
            clientX: x,
            clientY: y
          });
        }
        el.dispatchEvent(event);
      }

      function mouseDrag(opts, done) {
        var stepsDelay = 25;
        var doneDelay = 100;

        if (opts.count === 0) { // first step
          mouse(elScroll, 'mousedown', opts.x, opts.y);
        } else if (opts.count === 8) { // last step
          mouse(document, 'mouseup', opts.x, opts.y);
          setTimeout(done, doneDelay);
          return;
        }

        setTimeout(function() {
          mouse(document, 'mousemove', opts.x, opts.y);
          opts.count = opts.count + 1;
          opts.x = opts.x + opts.stepX;
          opts.y = opts.y + opts.stepY;
          mouseDrag(opts, done);
        }, stepsDelay);
      }


      function mouseWheel() {
        // simulate mouse wheel to scroll up for 'reset' at line 1
        for (var i = 0; i < 20; i ++) {
          var step = i;
          if (step >= 10) {  // decelerate at half way point
            step = 20 - step;
          }
          mouse(elScroll, 'mousewheel', 0, 10 * step);
        }
      }

      // delay start up for less than a sec to let browser finish loading
      // it's buggy in that any lag will make things weird
      setTimeout(function() {
        mouseWheel();
        // simulate mouse drag to select all
        mouseDrag({
          count: 0,
          x: 1,
          y: 1,
          stepX: 200,
          stepY: 200
        }, function() {
          // finally send text input
          var event = new KeyboardEvent('keydown');
          el.dispatchEvent(event)
          el.value = text;
          var event = new Event('input');
          el.dispatchEvent(event);
        });
      }, 300);
    }
  }
}

function kindredName(tab, actions) {
  var names = actions.reduce(function(tmpNames, action) {
    var n = Sizzle(action.actionElementName)[0];
    if (n === undefined) {
      chrome.runtime.sendMessage({ err: 'ACTION_NAME_NOT_FOUND', id: tab.id, action: action.actionElementName })
      // continue to loop and look for it even if it's undefined because 
      // maybe it'll show up eventually?
      // but this should be reported to the UI either way
      return tmpNames
    }
    var tag = n.tagName;

    var nText;
    switch(tag.toLowerCase()) {
      case 'input' || 'textarea':
        nText = n.value;
        break;
      default:
        nText = n.innerHTML;
    }

    var invalid = action.actionInvalidNames.filter(function(i) {
      return i == nText
    });

    if (invalid.length === 0 && nText !== '') {
      tmpNames.push(nText)
    }

    return tmpNames;
  }, []);

  // all or nothing, either all names get matched
  // or it starts over after 1 sec
  if (names.length !== actions.length) {
    window.setTimeout(function() {
      kindredName(tab, actions)
    }, 1000);
  } else {
    chrome.runtime.sendMessage({
      tab: tab,
      actions: actions,
      names: names
    });
  }
}

function kindredEdit(tabId, selector, text) {
  var el = Sizzle(selector)[0];
  if (el === undefined) {
    // even though it's not found here, it doesn't give up
    // indefinitely, as any subsequent incoming 
    // file data will call this function again
    chrome.runtime.sendMessage({ err: 'ACTION_EDIT_NOT_FOUND', id: tabId, action: selector })
    return;
  }

  var editor = '';

  var packs = Object.keys(strategies);
  for (var i = 0, l = packs.length; i < l; i++) {
    var detect = strategies[packs[i]].detect(el);
    if (detect) {
      editor = detect;
      break;
    }
  }

  if (editor) {
    console.log('running code for:', editor.name);
    editor.run(text);
  } else {
    console.log('running code for: simple input / textarea');
    // default is to treat as regular input / textarea
    // but still simulate keyboard events for unknown scripts
    // running on the page that may rely on it
    el.value = text;
    var event = new KeyboardEvent('keydown');
    el.dispatchEvent(event);
  }
}

chrome.runtime.onMessage.addListener(function(msg, sender, reply) {
  switch(msg.type) {
    case 'name':
      kindredName(msg.tab, msg.actions);
      break;
    case 'edit':
      kindredEdit(msg.id, msg.selector, msg.text);
      break;
  }
});
