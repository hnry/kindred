console.log('kindred extension loaded')

function kindredActions(actions) {
  var result = [];

  actions.forEach(function(action) {
    var n = Sizzle(action.actionElementName)[0];
    var nTag = n.tagName.toLowerCase();
    var nText = n.innerHTML;

    result.push(nText);
  })

  chrome.runtime.sendMessage(result);
}
