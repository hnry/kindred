// Object.assign polyfill for older Chrome browsers < 45
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
if (typeof Object.assign != 'function') {
  (function () {
    Object.assign = function (target) {
      'use strict';
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      var output = Object(target);
      for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source !== undefined && source !== null) {
          for (var nextKey in source) {
            if (source.hasOwnProperty(nextKey)) {
              output[nextKey] = source[nextKey];
            }
          }
        }
      }
      return output;
    };
  })();
}

var Store = {
  _subscribers: [],
  subscribe(fn) {
    this._subscribers.push(fn)
  },
  get(cb) {
    chrome.storage.sync.get({
      actions: defaultActions
    }, (storage) => {
      cb(storage.actions)
    })
  },
  set() {
    chrome.storage.sync.set() // TODO
    this.publish()
  },
  publish() {
    this._subscribers.forEach(fn => fn())
  }
}

class FormAction extends React.Component {
  constructor() {
    super()
    this.changeActionElementName = this.onChange.bind(this, 'actionElementName')
    this.changeActionElementEdit = this.onChange.bind(this, 'actionElementEdit')
  }

  onChange(name, e) {
    let action = Object.assign({}, this.props.action)
    action[name] = e.target.value
    this.props.onActionChange(action, this.props.index)
  }

  render() {
    return (<div>
      <input type='text' value={this.props.action.actionElementName} onChange={this.changeActionElementName} />
      <input type='text' value={this.props.action.actionElementEdit} onChange={this.changeActionElementEdit} />
      <input type='text' value={this.props.action.actionInvalidNames} />
      <input type='text' value={this.props.action.namePrefix} />
      <input type='text' value={this.props.action.nameSuffix} />
      <button>Remove</button>
    </div>)
  }
}

class Form extends React.Component {
  constructor() {
    super()
    this.initialState = {
        name: 'New Action Name',
        url: '',
        actionUrl: '',
        filePath: '',
        actions: []
    }
    this.initialAction = {
      //filePath: '',
      actionElementEdit: '',
      actionElementName: '',
      actionInvalidNames: [],
      namePrefix: '',
      nameSuffix: ''
    }

    this.state = Object.assign({}, this.initialState)

    this.changeName = this.onChange.bind(this, 'name')
    this.changeUrl = this.onChange.bind(this, 'url')
    this.changeActionUrl = this.onChange.bind(this, 'actionUrl')

    this.addAction = this.addAction.bind(this)
    this.onSave = this.onSave.bind(this)

    this.onActionChange = this.onActionChange.bind(this)
  }

  componentWillReceiveProps(props) {
    if (props.selected == 'new') {
      this.setState(Object.assign({}, this.initialState))
      return
    }
    this.setState(props.actions[props.selected])
  }

  onActionChange(action, index) {
    let actions = this.state.actions.slice(0, this.state.actions.length)
    actions[index] = action
    this.setState({ actions })
  }

  onSave() {
    console.log(this.state)
  }

  addAction() {
    let actions = this.state.actions.slice(0, this.state.actions.length)
    actions.push(Object.assign({}, this.initialAction))
    this.setState({ actions })
  }

  removeAction() {

  }

  onChange(name, e) {
    const c = {}
    c[name] = e.target.value
    this.setState(c)
  }

  renderActions() {
    return this.state.actions.map((action, idx) => {
      return (<FormAction key={idx} action={action} index={idx} onActionChange={this.onActionChange} />)
    })
  }

  render() {
    return (
      <div className="col right-col">
      File path

      Action Name:
      <input type="text" value={this.state.name} onChange={this.changeName} />
      URL:
      <input type="text" value={this.state.url} onChange={this.changeUrl} />
      Action URL:
      <input type="text" value={this.state.actionUrl} onChange={this.changeActionUrl} />
      <hr />
      {this.renderActions()}
      <button onClick={this.addAction}>Add a new action</button>
      <button onClick={this.onSave}>Save</button>
      </div>
    )
  }
}

class ActionsList extends React.Component {
  constructor() {
    super()
    this.state = {}
  }

  onSelect(selection) {
    this.props.onSelect(selection)
  }

  renderActions() {
    return this.props.actions.map((action, idx) => {
      return (<li key={idx} onClick={this.onSelect.bind(this, idx)}>{action.name}</li>)
    })
  }

  render() {
    return (
      <div className='col left-col'>
        <ul>
          <li id='new-action' onClick={this.onSelect.bind(this, 'new')}>Create New Action</li>
          {this.renderActions()}
        </ul>
      </div>
    )
  }
}

class Dashboard extends React.Component {
  constructor() {
    super()
    this.state = {
      actions: [],
      selected: 'new'
    }
    this.update()
  }

  update() {
    Store.get((actions) => {
      this.setState({actions: actions})
    })
  }

  componentDidMount() {
    Store.subscribe(this.update.bind(this))
  }

  onSelect(selection) {
    this.setState({selected: selection})
  }

  render() {
    return (
      <div>
        <ActionsList actions={this.state.actions} onSelect={this.onSelect.bind(this)} />
        <Form actions={this.state.actions} selected={this.state.selected} />
      </div>
    )
  }
}

ReactDOM.render(<Dashboard />, document.getElementById('dashboard'))
