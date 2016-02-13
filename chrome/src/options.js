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

// helps setup 2 way bindings for _generic_ onChange
function bindingsHelper(namePrefix, stateKeys) {
  stateKeys.forEach((k) => {
    const n = k[0].toUpperCase() + k.slice(1, k.length)
    this[namePrefix + n] = this.onChange.bind(this, k)
  })
}

class FormAction extends React.Component {
  constructor() {
    super()
    bindingsHelper.call(this, 'change', ['actionElementName', 'actionElementEdit', 'actionInvalidNames', 'namePrefix', 'nameSuffix'])

    this.onRemove = this.onRemove.bind(this)
  }

  onChange(name, e) {
    let action = Object.assign({}, this.props.action)
    action[name] = e.target.value
    this.props.editActionable(action, this.props.index)
  }

  onRemove() {
    this.props.removeActionable(this.props.index)
  }

  render() {
    const id = this.props.index

    return (<div>
      <label htmlFor={'elementname'+id}>Element Name:</label>
      <input id={'elementname'+id} type='text' value={this.props.action.actionElementName} onChange={this.changeActionElementName} />

      <label htmlFor={'elementedit'+id}>Element Edit:</label>
      <input id={'elementedit'+id} type='text' value={this.props.action.actionElementEdit} onChange={this.changeActionElementEdit} />

      <label htmlFor={'invalidnames'+id}>Invalid Names</label>
      <input id={'invalidnames'+id} type='text' value={this.props.action.actionInvalidNames} onChange={this.changeActionInvalidNames} />

      <label htmlFor={'nameprefix'+id}>Name Prefix:</label>
      <input id={'nameprefix'+id} type='text' value={this.props.action.namePrefix} onChange={this.changeNamePrefix} />

      <label htmlFor={'namesuffix'+id}>Name Suffix:</label>
      <input id={'namesuffix'+id} type='text' value={this.props.action.nameSuffix} onChange={this.changeNameSuffix} />
      <button onClick={this.onRemove}>Remove</button>
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

    bindingsHelper.call(this, 'change', ['filePath', 'name', 'url', 'actionUrl'])

    this.onSave = this.onSave.bind(this)
    this.onRemove = this.onRemove.bind(this)

    this.addActionable = this.addActionable.bind(this)
    this.editActionable = this.editActionable.bind(this)
    this.removeActionable = this.removeActionable.bind(this)
  }

  componentWillReceiveProps(props) {
    if (props.selected == 'new') {
      this.setState(Object.assign({}, this.initialState))
      return
    }
    this.setState(props.actions[props.selected])
  }

  onSave() {
    // TODO validation & obviously actually saving
    console.log(this.state)
  }

  onRemove() {
    // TODO show a modal dialog to confirm
  }

  editActionable(action, index) {
    let actions = this.state.actions.slice(0, this.state.actions.length)
    actions[index] = action
    this.setState({ actions })
  }

  addActionable() {
    let actions = this.state.actions.slice(0, this.state.actions.length)
    actions.push(Object.assign({}, this.initialAction))
    this.setState({ actions })
  }

  removeActionable(index) {
    let actions = this.state.actions.slice(0, this.state.actions.length)
    actions.splice(index, 1)
    this.setState({ actions })
  }

  onChange(key, e) {
    const c = {}
    c[key] = e.target.value
    this.setState(c)
  }

  renderActions() {
    return this.state.actions.map((action, idx) => {
      return (<FormAction key={idx} action={action} index={idx} editActionable={this.editActionable} removeActionable={this.removeActionable} />)
    })
  }

  render() {
    const showDelete = () => {
      if (this.props.selected != 'new') {
        return (<button onClick={this.onRemove}>Delete</button>)
      }
    }

    return (<div className="col right-col">
      <label htmlFor='filepath'>File path:</label>
      <input id='filepath' type='text' value={this.state.filePath} onChange={this.changeFilePath} />

      <label htmlFor='actionName'>Action Name:</label>
      <input id='actionName' type="text" value={this.state.name} onChange={this.changeName} />

      <label htmlFor='url'>URL:</label>
      <input id='url' type="text" value={this.state.url} onChange={this.changeUrl} />

      <label htmlFor='actionUrl'>Action URL:</label>
      <input id='actionUrl' type="text" value={this.state.actionUrl} onChange={this.changeActionUrl} />

      <hr />
      {this.renderActions()}
      <button onClick={this.addActionable}>Add a new action</button>
      <button onClick={this.onSave}>Save</button>
      {showDelete()}
    </div>)
  }
}

class ActionsList extends React.Component {
  constructor() {
    super()
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
        <ActionsList actions={this.state.actions} selected={this.state.selected} onSelect={this.onSelect.bind(this)} />
        <Form actions={this.state.actions} selected={this.state.selected} />
      </div>
    )
  }
}

ReactDOM.render(<Dashboard />, document.getElementById('dashboard'))
