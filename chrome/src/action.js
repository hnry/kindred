console.log('kindred extension loaded');

function kindredName(tab, actions) {
  var names = actions.reduce(function(tmpNames, action) {
    var n = $(action.actionElementName)[0];
    var tag = $(n).prop('tagName')

    var nText;
    switch(tag.toLowerCase()) {
      case 'input':
        nText = $(n).val();
        break;
      default:
        nText = $(n).text() || $(n).innerHTML;
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
  //var el = $(selector)[0];
  var el = $('.CodeMirror textarea')[0]
  var tag = $(el).prop('tagName');

  // check if tag exists TODO
/*
  el.addEventListener('keydown', function(e) {
    console.log('listen>', e)
  })*/

  switch(tag.toLowerCase()) {
    // code mirror crap
    case 'textarea':
      console.log('firing code mirror action');

      // select all texts
      var elScroll = document.getElementsByClassName('CodeMirror-scroll')[0];

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

      function simulateMouse(opts, done) {
        if (opts.count === 0) {
          mouse(elScroll, 'mousedown', opts.x, opts.y);
        } else if (opts.count === 8) {
          mouse(document, 'mouseup', opts.x, opts.y);
          setTimeout(done, 100);
          return;
        }
        setTimeout(function() {
          mouse(document, 'mousemove', opts.x, opts.y);
          opts.count = opts.count + 1;
          opts.x = opts.x + opts.stepX;
          opts.y = opts.y + opts.stepY;
          simulateMouse(opts, done);
        }, 25);
      }

      simulateMouse({
        count: 0,
        x: 1,
        y: 1,
        stepX: 200,
        stepY: 200
      }, function() {
        var event = new KeyboardEvent('keydown');
        el.dispatchEvent(event)
        el.value = text;
        var event = new Event('input');
        el.dispatchEvent(event);
        setTimeout(function () {
        mouse(elScroll, 'mousewheel', 0, 10);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 100);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 10);
        mouse(elScroll, 'mousewheel', 0, 10);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 100);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 10);
        mouse(elScroll, 'mousewheel', 0, 10);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 100);
        mouse(elScroll, 'mousewheel', 0, 75);
        mouse(elScroll, 'mousewheel', 0, 50);
        mouse(elScroll, 'mousewheel', 0, 10);
        }, 400);
      });
      break;

    default:
      $(el).val(text);
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
