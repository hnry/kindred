var defaultActions = [
  {
    name: 'Test action 1',
    url: 'https://facebook.github.io/react/',
    actionUrl: 'https://facebook.github.io/react/',
    actions: [
      {
        actionElementEdit: '#markdownExample .MarkdownEditor textarea',
        actionElementName: '#markdownExample h3',
        actionInvalidNames: [],
        namePrefix: '',
        nameSuffix: '.js'
      }
    ]
  },
  {
    name: 'Test action 2',
    url: 'http://example.com',
    actionUrl: 'http://example.com/test',
    actions: [
      {
        actionElementEdit: '',
        actionElementName: '',
        actionInvalidNames: ['yea', 'what'],
        namePrefix: '',
        nameSuffix: ''
      }
    ]
  }
]

if (typeof module !== 'undefined' && module.exports) {
  module.exports = defaultActions
}
