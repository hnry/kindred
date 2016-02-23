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
        required: c.props.required,
        onChange: this.onChange.bind(this)
      }
      return (<div>{r}</div>)
    }
  }

  it('validation - minimum length', () => {
    const form = mount(<Ctxt>{() => <Input label=''  minLength='8' />}</Ctxt>)

    const i = form.find(Input).get(0)
    const input = form.find('input').get(0)
    typing(input, 'hihi')

    expect(i.changed).toBe(true)
    expect(i.error).toBe('')
    TestUtils.Simulate.blur(input)
    expect(i.error).toBe('Too short.')

    // error stays after being re-focused
    TestUtils.Simulate.focus(input)
    expect(i.error).toBe('Too short.')

    // still not valid
    typing(input, 'hihi12')
    TestUtils.Simulate.blur(input)
    expect(i.error).toBe('Too short.')

    // now ok
    typing(input, 'hihi1234')
    expect(i.error).toBe('')
    TestUtils.Simulate.blur(input)
    expect(i.error).toBe('')

    // empty is ok too, that's `required` validation
    typing(input, '')
    TestUtils.Simulate.blur(input)
    expect(i.error).toBe('')
  })

  it('validation - required', () => {
    const form = mount(<Ctxt>{() => <Input label=''  required />}</Ctxt>)

    const i = form.find(Input).get(0)
    const input = form.find('input').get(0)

    typing(input, 'x')
    expect(i.changed).toBe(true)
    expect(i.error).toBe('')

    typing(input, '    ')
    expect(i.error).not.toBe('')
    typing(input, 'ok')
    expect(i.error).toBe('')
    typing(input, '')
    expect(i.error).not.toBe('')
  })
})
