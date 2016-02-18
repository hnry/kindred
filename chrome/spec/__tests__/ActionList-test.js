import React from 'react'
import {shallow} from 'enzyme'

import defaultActions from '../../src/defaultActions.js'

const {ActionsList, FormAction, Form, Input} = require('../../src/options.js')

describe('ActionsList', () => {

  it('renders Actions', () => {
    const actionList = shallow(<ActionsList actions={defaultActions} />)
    // default has 2 + 1 (new action) = 3
    expect(actionList.find('li').length).toBe(3)
  })

  it('changes selected', (done) => {
    let clicks = 0
    const testSelect = (selection) => {
      clicks += 1
      if (clicks === 1) {
        expect(selection).toBe('new')
      } else {
        expect(selection).toBe(1)
        done()
      }
    }
    const actionList = shallow(<ActionsList actions={defaultActions} onSelect={testSelect} />)

    actionList.find('li').first().simulate('click')
    actionList.find('li').last().simulate('click')
  })

})
