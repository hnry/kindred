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
      let a = actions.slice()
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
      let a = actions.slice()
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
    const n = k[0].toUpperCase() + k.slice(1)
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
      <Input index={id} label='Element Name' value={this.props.action.actionElementName} onChange={this.changeActionElementName} required />
      <Input index={id} label='Element Edit' value={this.props.action.actionElementEdit} onChange={this.changeActionElementEdit} required />
      <Input index={id} label='Invalid Names' value={this.props.action.actionInvalidNames} onChange={this.changeActionInvalidNames} />
      <Input index={id} label='Prefix' value={this.props.action.namePrefix} onChange={this.changeNamePrefix} />
      <Input index={id} label='Suffix' value={this.props.action.nameSuffix} onChange={this.changeNameSuffix} />
      <button onClick={this.onRemove}>Remove</button>
    </div>)
  }
}

class Input extends React.Component {
  constructor() {
    super()
    this.state = { error: '' }
    this.onChange = this.onChange.bind(this)

    this.error = ''
    this.changed = false
    this.firstProp = false
    this.origValue = null
  }

  static contextTypes = {
    register: React.PropTypes.func,
    unregister: React.PropTypes.func
  };

  componentWillMount() {
    this.context.register(this)
  }

  componentWillReceiveProps(props) {
    if (!this.firstProp) {
      this.firstProp = true
      this.origValue = props.value
    }
  }

  componentWillUnmount() {
    this.context.unregister(this)
  }

  setError(err) {
    this.error = err
    this.setState({error: err})
  }

  validate(v) {
    v = typeof v === 'undefined' ? this.props.value : v;
    let err = ''

    if (this.props.required && v == '') {
      err = 'Cannot be empty.'
      this.setError(err)
      return
    }

    if (this.props.unique && !err && v) {
      const savedName = this.props.name.name || ''
      Store.get((actions) => {
        for (let i = 0, l = actions.length; i < l; i++) {
          const testn = actions[i].name.toLowerCase()
          if (testn !== savedName.toLowerCase() && testn === v.toLowerCase()) {
            err = 'Name must be unique.'
            break;
          }
        }
        this.setError(err)
      })
      return
    }

    this.setError('')
  }

  onChange(e) {
    const newValue = e.target.value
    this.validate(newValue)

    if (this.origValue !== null && !this.changed && newValue !== this.origValue) {
      this.changed = true
    } else if (this.changed && newValue === this.origValue) {
      this.changed = false
    }

    this.props.onChange(newValue)
  }

  render() {
    const key = this.props.index || ''
    return (<span>
      <label htmlFor={'input-'+key+ this.props.label}>{this.props.label}:</label>
      <span>{this.state.error}</span>
      <input id={'input-'+key+ this.props.label} type="text" value={this.props.value} onChange={this.onChange} />
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

    this.inputs = []
  }

  static childContextTypes = {
    register: React.PropTypes.func,
    unregister: React.PropTypes.func
  };

  register(input) {
    if (this.inputs.indexOf(input) === -1) {
      this.inputs.push(input);
    }
  }

  unregister(input) {
    const i = this.inputs.indexOf(input)
    if (i !== -1) {
      this.inputs.splice(1, 1)
    }
  }

  getChildContext() {
    return {
      register: this.register.bind(this),
      unregister: this.unregister.bind(this)
    }
  }

  runValidators() {
    this.inputs.forEach((input) => {
      input.validate()
    })
  }

  isValid() {
    let v = true
    for (let i = 0, l = this.inputs.length; i < l; i++) {
      if (this.inputs[i].error !== '') {
        v = false
        break
      }
    }
    return v
  }

  isChanged() {
    let v = false
    for (let i = 0, l = this.inputs.length; i < l; i++) {
      if (this.inputs[i].changed) {
        v = true
        break
      }
    }
    return v
  }

  componentWillReceiveProps(props) {
    if (props.action == 'new') {
      const action = this._copyAction(this.initialAction)
      this.setState({action})
      return
    }

    const action = this._copyAction(props.action)
    this.setState({action})
  }

  _copyAction(action) {
    let a = Object.assign({}, action)
    a.actions = Object.assign([], action.actions)
    //a.actions.actionInvalidNames = Object.assign([], action.actions.actionInvalidNames)
    return a
  }

  onSave() {
    const action = this.state.action
    this.runValidators()
    if (this.isValid()) {
      alert('save')
      /*
      if (this.props.selected == 'new') {
        Store.save(action)
      } else {
        Store.save(action, this.props.actions[this.props.selected])
      }*/
    }
  }

  onRemove() {
    const r = window.confirm('Are you sure you want to delete ' + this.props.action.name + '?')
    if (r) {
      Store.del(this.state.actionOrig)
    }
  }

  addActionable() {
    const action = this._copyAction(this.state.action)
    action.actions.push(Object.assign({}, this.initialActionable))
    this.setState({ action })
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
    action[key] = e
    this.setState({ action })
  }

  showSave() {
    // TODO the isValid is buggy here as far as the rendering of it
    // it's correct, but it doesn't force a render() update
    // so sometimes it's not visually obvious through the save button
    if (this.isChanged() && this.isValid()) {
        return (<button onClick={this.onSave}>Save</button>)
    }
    return (<button onClick={this.onSave} disabled>Save</button>)
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

    const isSelected = () => {
      if (!this.props.selected) {
        return ' hide'
      }
      return ''
    }

    return (<div className={"col right-col" + isSelected()}>
      <Input label='File path' value={this.state.action.filePath} onChange={this.changeFilePath} required />
      <Input label='Action Name' name={this.props.action || ''} value={this.state.action.name} onChange={this.changeName} required unique />
      <Input label='URL' value={this.state.action.url} onChange={this.changeUrl} />
      <Input label='Action URL' value={this.state.action.actionUrl} onChange={this.changeActionUrl} required />
      <hr />
      {this.renderActions()}
      <button onClick={this.addActionable}>Add a new action</button>
      {this.showSave()}
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

  renderForms() {
    return this.state.actions.map((action, idx) => {
      return (<Form key={idx} action={action} selected={this.state.selected === idx} />)
    })
  }

  render() {
    return (
      <div>
        <ActionsList actions={this.state.actions} selected={this.state.selected} onSelect={this.onSelect.bind(this)} />
        <Form key='new' action='new' selected={this.state.selected === 'new'} />
        {this.renderForms()}
      </div>
    )
  }
}

ReactDOM.render(<Dashboard />, document.getElementById('dashboard'))
