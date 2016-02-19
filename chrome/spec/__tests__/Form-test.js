import React from 'react'
import {shallow, mount} from 'enzyme'
import TestUtils from 'react-addons-test-utils';

const {Form, Input} = require('../../src/options.js')

function typing(node, str) {
  node.value = str
  TestUtils.Simulate.change(node)
}

describe('Form', () => {

  it('renders 4 <Input /> initially', () => {
    const f = shallow(<Form action='new' />)
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

  it('save button is disabled initially', () => {
    const f = mount(<Form action={defaultActions[0]} />)
    const save = f.find('button').get(2)
    expect(save.textContent).toBe('Save')
    expect(save.disabled).toBe(true)
  })

  it('save button is enabled on change', () => {
    const f = mount(<Form action={defaultActions[0]} selected={true} />)
    const save = f.find('button').get(2)
    expect(save.disabled).toBe(true)

    const inputName = f.find(Input).get(0)
    const input = f.find('input').get(0)

    typing(input, 'changing')

    expect(inputName.error).toEqual('')
    expect(inputName.changed).toBe(true)
    f.update()
    expect(save.disabled).toBe(false)
  })

  it('save button is enabled on change for actions too', () => {
    const f = mount(<Form action={defaultActions[0]} selected={true} />)
    const save = f.find('button').get(2)
    expect(save.textContent).toBe('Save')
    expect(save.disabled).toBe(true)

    const inputName = f.find(Input).at(4)
    const label = inputName.find('label').get(0)
    expect(label.textContent).toBe('Element Name')

    const input = inputName.find('input').get(0)

    typing(input, 'aaaa')
    expect(save.disabled).toBe(false)

    typing(input, 'aaaa2')
    expect(save.disabled).toBe(false)
  })

  it('save begins to lag behind when unique name error is triggered', (done) => {
    const f = mount(<Form action={defaultActions[0]} selected={true} />)
    const save = f.find('button').get(2)
    expect(save.textContent).toBe('Save')

    const inputName = f.find(Input).at(0)
    const label = inputName.find('label').get(0)
    expect(label.textContent).toBe('Name')

    const input = inputName.find('input').get(0)

    typing(input, 'Test actiona')
    f.update()
    expect(save.disabled).toBe(false)

    typing(input, 'Test actionn')
    setTimeout(() => {
      expect(inputName.get(0).error).toBe('Name must be unique.')
      expect(save.disabled).toBe(true)

      typing(input, 'Test actionnn')
      setTimeout(() => {
        expect(inputName.get(0).error).toBe('')
        expect(save.disabled).toBe(false)
        done()
      }, 5)
    }, 5)
  })

  it('changes are registered on Input and refleced with save button', () => {
    const f = mount(<Form action={defaultActions[0]} selected={true} />)
    const save = f.find('button').get(2)
    expect(save.textContent).toBe('Save')

    let inputName = f.find(Input).at(0)
    const input = inputName.find('input').get(0)
    inputName = inputName.get(0)
    expect(input.value).toBe('Test action')
    expect(inputName.changed).toBe(false)

    typing(input, 'Test actionzzz')
    expect(inputName.changed).toBe(true)

    // change back to original
    typing(input, 'Test action')
    expect(inputName.changed).toBe(false)
    expect(save.disabled).toBe(true)
  })

  it('onSave()', (done) => {
    const f = mount(<Form action='new' selected={true} />)

    global.chrome.storage.sync.set = () => {
      throw('should not be called')
    }

    const inputName = f.find(Input).at(0)
    const input = inputName.find('input').get(0)

    typing(input, 'hihi')

    const form = f.get(0)
    form.onSave()
    setTimeout(done, 200)
  })
})
