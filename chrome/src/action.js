console.log('kindred extension loaded');

var codepacks = {
  codemirror: {
    detect: function(el) {
      // scan for CodeMirror container
      // and if `el` is inside container then it is CodeMirror
      // 
      // TODO this doesn't work well if there are 2+ CodeMirrors on the page
      var result;
      var codemirror = Sizzle('.CodeMirror');
      if (codemirror.length) {
        var result = codemirror.some(function(cmEl) {
          var n = el.parentNode;
          while (n !== null) {
            if (n === cmEl) {
              return true;
            }
            n = n.parentNode;
          }
          return false;
        });
      }

      if (result) {
        return { name: 'codemirror', run: this.runner.bind(undefined, codemirror[0]) };
      }
    },
    runner: function(el, text) {
      // unfortunately codemirror does not provide an easy way to interface
      // with it through the DOM, so resorting to this...
      // 
      // Cannot use select all keyboard event because of Chrome bug
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

      // simulate mouse wheel to scroll up for 'reset' at line 1
      for (var i = 0; i < 20; i ++) {
        var step = i;
        if (step >= 10) {  // decelerate at half way point
          step = 20 - step;
        }
        mouse(elScroll, 'mousewheel', 0, 10 * step);
      }

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
    }
  }
}

function kindredName(tab, actions) {
  var names = actions.reduce(function(tmpNames, action) {
    var n = Sizzle(action.actionElementName)[0];
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
  // or it starts over
  if (names.length !== actions.length) {
    window.setTimeout(function() {
      kindredName(tab, actions)
    }, 1000)
  } else {
    chrome.runtime.sendMessage({
      tab: tab,
      actions: actions,
      names: names
    })
  }
}

function kindredEdit(selector, text) {
  var el = Sizzle(selector)[0];
  if (el === undefined) {
    // TODO
    // this needs to be reported to UI
    console.log('actionElementEdit is not found on page');
    return;
  }

  var editor = '';

  var packs = Object.keys(codepacks);
  for (var i = 0, l = packs.length; i < l; i++) {
    var detect = codepacks[packs[i]].detect(el);
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
      kindredEdit(msg.selector, msg.text);
      break;
  }
});
