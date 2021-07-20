import configureStore from 'redux-mock-store'

import React from 'react';
import ReactDOM from 'react-dom';
import { configure, shallow, mount} from 'enzyme';
import { expect } from 'chai';
import Adapter from 'enzyme-adapter-react-16'

import {Provider} from "react-redux"
import { BrowserRouter as Router } from 'react-router-dom';
import { Link } from "react-router-dom";

import Header from "./Header"

const mockStore = configureStore();


const initialState = {
	timestamp : {
		compilation_data : [1]
	}
};
let store = mockStore(initialState)

configure({ adapter: new Adapter() });
describe('header component testing', function() {

  it('renders surface components', function() {
    const wrapper = mountFromComponent(<Header /> );
    expect(wrapper.find('#mainNavBar').length).to.equal(1);
    expect(wrapper.find('#navBarTitle').length).to.equal(1);
  });

  describe('non changing state', function(){
  	//component set state
  	var state = {
      noHeader:[
      '/login'],
      tabs : [{
        path: '/home',
        text: 'Home'
      }],
      actions: [{
        text:'Logout',
        action: this.logout
      }]
    }

  	it('render header tabs(paths and actions)', function() {
		const wrapper = mountFromComponent(<Header />);
		var homeLink =  <Link to='/home'>Home</Link>
		expect(wrapper.find('#navBarHeaders').contains(homeLink)).to.equal(true);
		var logoutAction =  <div className='actionHeader'>Logout</div>
		expect(wrapper.find('#navBarHeaders').contains(logoutAction)).to.equal(true);
	})


  })



});


function shallowForComponent(component) {
	return shallow(
		<Provider store={store}>
			<Router>
	   			{component} 
	   		</Router>
		</Provider>)
}


function mountFromComponent(component) {
	return mount(
		<Provider store={store}>
			<Router>
	   			{component} 
	   		</Router>
		</Provider>)
}