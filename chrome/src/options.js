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
  save(action, prevAction) {
    this.get((actions) => {
      let a = actions.slice(0, actions.length)
      if (prevAction) {
        for (let i = 0, l = a.length; i < l; i++) {
          if (a[i].name.toLowerCase() === prevAction.name.toLowerCase()) {
            a[i] = action
            break
          }
        }
      } else {
        a.push(action)
      }

      this._set(a)
    })
  },
  del(action) {
    this.get((actions) => {
      let a = actions.slice(0, actions.length)
      for (let i = 0, l = a.length; i < l; i++) {
        if (a[i].name.toLowerCase() === action.name.toLowerCase()) {
          a.splice(i, 1)
          this._set(a)
          break
        }
      }
    })
  },
  _set(actions) {
    chrome.storage.sync.set({actions: actions}, () => {
      this.publish()
    })
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
    action[name] = e
    this.props.editActionable(action, this.props.index)
  }

  onRemove() {
    this.props.removeActionable(this.props.index)
  }

  render() {
    const id = this.props.index

    return (<div>
      <Input key={id} label='Element Name:' value={this.props.action.actionElementName} onChange={this.changeActionElementName} />
      <Input key={id} label='Element Edit:' value={this.props.action.actionElementEdit} onChange={this.changeActionElementEdit} />
      <Input key={id} label='Invalid Names:' value={this.props.action.actionInvalidNames} onChange={this.changeActionInvalidNames} />
      <Input key={id} label='Prefix:' value={this.props.action.namePrefix} onChange={this.changeNamePrefix} />
      <Input key={id} label='Suffix:' value={this.props.action.nameSuffix onChange={this.changeNameSuffix} />
      <button onClick={this.onRemove}>Remove</button>
    </div>)
  }
}

class Input extends React.Component {
  constructor() {
    super()
    this.state = { error: '' }
    this.onChange = this.onChange.bind(this)
  }

  onChange(e) {
    // run validators
    let err = ''
    if (e.target.value === '') {
      err = 'Cannot be empty.'
    }
    this.setState({error: err})
    this.props.onChange(e.target.value, err)
  }

  render() {
    return (<span>
      <label htmlFor={'input-'+this.props.key+'-'+ this.props.value}>{this.props.label}</label>
      <span>{this.state.error}</span>
      <input id={'input-'+this.props.key+'-'+ this.props.value} type="text" value={this.props.value} onChange={this.onChange} />
    </span>)
  }
}

class Form extends React.Component {
  constructor() {
    super()
    this.initialAction = {
        name: 'New Action Name',
        url: '',
        actionUrl: '',
        filePath: '',
        actions: []
    }
    this.initialActionable = {
      //filePath: '',
      actionElementEdit: '',
      actionElementName: '',
      actionInvalidNames: [],
      namePrefix: '',
      nameSuffix: ''
    }

    this.state = {action: Object.assign({}, this.initialAction)}

    bindingsHelper.call(this, 'change', ['filePath', 'name', 'url', 'actionUrl'])

    this.onSave = this.onSave.bind(this)
    this.onRemove = this.onRemove.bind(this)

    this.addActionable = this.addActionable.bind(this)
    this.editActionable = this.editActionable.bind(this)
    this.removeActionable = this.removeActionable.bind(this)
  }

  componentWillReceiveProps(props) {
    if (props.selected == 'new') {
      const action = this._copyAction(this.initialAction)
      this.setState({action})
      return
    }

    const action = this._copyAction(props.actions[props.selected])
    this.setState({action})
  }

  _copyAction(action) {
    let a = Object.assign({}, action)
    a.actions = Object.assign([], action.actions)
    //a.actions.actionInvalidNames = Object.assign([], action.actions.actionInvalidNames)
    return a
  }

  onSave() {
    // TODO validation
    if (this.props.selected == 'new') {
      Store.save(this.state.action)
    } else {
      Store.save(this.state.action, this.props.actions[this.props.selected])
    }
  }

  onRemove() {
    const r = window.confirm('Are you sure you want to delete ' + this.state.action.name + '?')
    if (r) {
      Store.del(this.state.actionOrig)
    }
  }

  addActionable() {
    const a = this._copyAction(this.state.action)
    a.actions.push(Object.assign({}, this.initialActionable))
    this.setState({ action: a })
  }

  editActionable(editedAction, index) {
    const action = this._copyAction(this.state.action)
    action.actions[index] = editedAction
    this.setState({ action })
  }

  removeActionable(index) {
    const action = this._copyAction(this.state.action)
    action.actions.splice(index, 1)
    this.setState({ action })
  }

  onChange(key, e) {
    let action = Object.assign({}, this.state.action)
    if (e && e.target && e.target.value) {
      action[key] = e.target.value
    } else {
      action[key] = e
    }
    this.setState({ action })
  }

  renderActions() {
    return this.state.action.actions.map((action, idx) => {
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
      <Input label='File path:' value={this.state.action.filePath} onChange={this.changeFilePath} />
      <Input label='Action Name:' value={this.state.action.name} onChange={this.changeName} />
      <Input label='URL:' value={this.state.action.url} onChange={this.changeUrl} />
      <Input label='Action URL:' value={this.state.action.actionUrl} onChange={this.changeActionUrl} />
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
