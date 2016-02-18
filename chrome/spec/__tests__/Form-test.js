import React from 'react'
import {shallow, mount} from 'enzyme'
import TestUtils from 'react-addons-test-utils';

import defaultActions from '../../src/defaultActions.js'

const {Form, Input} = require('../../src/options.js')

function typing(node, str) {
  node.value = str
  TestUtils.Simulate.change(node)
}

describe('Form', () => {

  it('renders 4 <Input /> initially', () => {
    const f = shallow(<Form />)
    const inputs = f.find(Input)
    expect(inputs.length).toBe(4)
  })

  it('renders 2 buttons (no delete button) when new form', () => {
    const f = shallow(<Form action='new' selected={true} />)
    const buttons = f.find('button')
    expect(buttons.length).toBe(2)
  })

  it('renders 3 buttons when form with action', () => {
    const f = shallow(<Form action={defaultActions[0]} />)
    const buttons = f.find('button')
    expect(buttons.length).toBe(3)
  })

  it('clicking add action produces more Inputs', () => {
    const f = mount(<Form action='new' />)
    const addaction = f.find('button').first()
    addaction.simulate('click')
    let inputs = f.find(Input)
    // adds 5 from the initial 4 when button clicked
    expect(inputs.length).toBe(9) // 4+5

    addaction.simulate('click')
    inputs = f.find(Input)
    expect(inputs.length).toBe(14) // 4+5+5
  })

  it('save is disabled initially', () => {
    const f = mount(<Form action={defaultActions[0]} />)
    const save = f.find('button').get(2)
    expect(save.textContent).toBe('Save')
    expect(save.disabled).toBe(true)
  })

  it('save is enabled on change', () => {
    const f = mount(<Form action={defaultActions[0]} selected={true} />)
    const save = f.find('button').get(1)
    const inputName = f.find(Input).get(0)
    const input = f.find('input').get(0)

    typing(input, 'changing')

    expect(inputName.error).toEqual('')
    expect(inputName.changed).toBe(true)
    expect(save.disabled).toBe(false)
  })
})
