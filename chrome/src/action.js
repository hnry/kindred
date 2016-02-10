console.log('kindred extension loaded');

function kindredName(actions) {
  return actions.map(function(action) {
    var n = $(action.actionElementName)[0];
    var nText = $(n).text() || n.innerHTML;
    return nText;
  });
}

function kindredEdit(selector, text) {
  var el = $(selector)[0];
  $(el).val(text);
}

chrome.runtime.onMessage.addListener(function(msg, sender, reply) {
  switch(msg.type) {
    case 'name':
      reply(kindredName(msg.actions));
      break;
    case 'edit':
      kindredEdit(msg.selector, msg.text);
      break;
  }
});
