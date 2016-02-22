import React from 'react'
import {mount} from 'enzyme'

var TestUtils = require('react-addons-test-utils')

const {Input, Form} = require('../../src/options.js')

describe('Input', () => {

  class Ctxt extends React.Component {
    constructor() {
      super()
      this.state = { value: '' }
    }

    static childContextTypes = {
      register: React.PropTypes.func,
      unregister: React.PropTypes.func
    };

    getChildContext() {
      return {
        register: () => {},
        unregister: () => {}
      }
    }

    onChange(val) {
      this.setState({ value: val })
    }

    render() {
      const c = this.props.children()
      const r = Object.assign({}, c)
      r.props = {
        label: c.props.label,
        value: this.state.value,
        minLength: c.props.minLength,
        onChange: this.onChange.bind(this)
      }
      return (<div>{r}></div>)
    }
  }

  it('validation - minimum length', () => {
    const form = mount(<Ctxt>{() => <Input label=''  minLength='8' />}</Ctxt>)

    const i = form.find(Input).get(0)
    const input = form.find('input').first()
    typing(input.get(0), 'hihi')

    expect(i.changed).toBe(true)
    expect(i.error).toBe('')
    TestUtils.Simulate.blur(input.get(0))
    expect(i.error).toBe('Too short.')

    // error stays after being re-focused
    TestUtils.Simulate.focus(input.get(0))
    expect(i.error).toBe('Too short.')

    // still not valid
    typing(input.get(0), 'hihi12')
    TestUtils.Simulate.blur(input.get(0))
    expect(i.error).toBe('Too short.')

    // now ok
    typing(input.get(0), 'hihi1234')
    expect(i.error).toBe('')
    TestUtils.Simulate.blur(input.get(0))
    expect(i.error).toBe('')

    // empty is ok too, that's `required` validation
    typing(input.get(0), '')
    TestUtils.Simulate.blur(input.get(0))
    expect(i.error).toBe('')
  })


})
