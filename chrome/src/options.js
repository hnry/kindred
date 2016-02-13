var Store = {
  _subscribers: [],
  subscribe(fn) {
    this._subscribers.push(this._subscribers)
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

class View extends React.Component {
  constructor() {
    super()
  }

  onSave() {
  }

  addAction() {

  }

  render() {
    let action = {
        name: 'New Action Name',
        url: '',
        actionUrl: '',
        filePath: '',
        actions: []
    }

    if (this.props.selected != 'new') {
      action = this.props.actions[this.props.selected]
    }

    return (
      <div className="col right-col">
      File path

      Action Name:
      <input type="text" value={action.name} />
      URL:
      <input type="text" value={action.url} />
      Action URL:
      <input type="text" value={action.actionUrl} />
      <hr />
      <button onClick={this.addAction}>Add a new action</button>
      <button onClick={this.onSave}>Save</button>
      </div>
    )
  }
}

class Actions extends React.Component {
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
        <Actions actions={this.state.actions} onSelect={this.onSelect.bind(this)} />
        <View actions={this.state.actions} selected={this.state.selected} />
      </div>
    )
  }
}

ReactDOM.render(<Dashboard />, document.getElementById('dashboard'))
