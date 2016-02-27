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
    name: 'Quantopian',
    url: 'https://www.quantopian.com/',
    actionUrl: 'https://www.quantopian.com/algorithms',
    filePath: '',
    actions: [
      {
        actionElementEdit: '.CodeMirror textarea',
        actionElementName: '#subnav input',
        actionInvalidNames: [],
        namePrefix: '',
        nameSuffix: '.py'
      }
    ]
  }
]

if (typeof module !== 'undefined' && module.exports) {
  module.exports = defaultActions
}
