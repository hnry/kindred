module.exports = [
  {
    name: 'Test action',
    url: '',
    actionUrl: 'http://example.com/test',
    filePath: '/test',
    actions: [
      {
        actionElementEdit: 'edit',
        actionElementName: 'name',
        actionInvalidNames: [],
        namePrefix: '',
        nameSuffix: ''
      }
    ]
  },
  {
    name: 'Test actionn',
    url: 'http://example.com',
    actionUrl: 'http://example.com/test',
    actions: [
      {
        actionElementEdit: '.blah p',
        actionElementName: '.blah h3',
        actionInvalidNames: ['new name'],
        namePrefix: 'example-',
        nameSuffix: '.js'
      }
    ]
  }
  ,
  {
    name: 'Test actiön 3',
    url: 'http://example.com',
    actionUrl: 'http://example.com/test',
    actions: [
      {
        actionElementEdit: '.test-t a p',
        actionElementName: '#blah div',
        actionInvalidNames: ['new name'],
        namePrefix: 'tèst-',
        nameSuffix: '.js'
      },
      {
        actionElementEdit: '.test-t a b',
        actionElementName: '#blah div',
        actionInvalidNames: ['new name'],
        namePrefix: 'tèst-',
        nameSuffix: '.css'
      },
      {
        actionElementEdit: '.test-t a t',
        actionElementName: '#blah div',
        actionInvalidNames: ['new name'],
        namePrefix: 'html',
        nameSuffix: '.html'
      }
    ]
  }
]
