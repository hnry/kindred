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
  var el = $(selector)[0];
  $(el).val(text);
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
