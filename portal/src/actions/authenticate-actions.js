import { GET_LOCAL_AUTH_TOKEN, LOGIN_REQUEST_STATUS, LOGIN_USER, LOGOUT } from './action-types'

import {login} from './timestamp-server-actions'
import {clearErrors} from './notification-actions'



export var getLocalAuthToken = () => dispatch => {
	var localAuthToken = localStorage.getItem('ss_auth')
	dispatch({
		type: GET_LOCAL_AUTH_TOKEN,
		payload: localAuthToken
	})
}

export var loginWithCredentials = (data) => dispatch => {
	console.log('login with creds')
	console.log(data)
	dispatch({
		type:LOGIN_REQUEST_STATUS,
		payload:true
	})

	var onSucsess = (res) => {
		localStorage.setItem('ss_auth', res.auth_token)

		dispatch({
			type : LOGIN_USER,
			payload: res.auth_token
		})
	}

	var onFailure = (res) => {
		dispatch({
			type:LOGIN_REQUEST_STATUS,
			payload:false
		})
	}

	login(dispatch, data, onSucsess, onFailure)
}

export var logout = () => dispatch => {
	dispatch(clearErrors())
	localStorage.removeItem('ss_auth')
	dispatch({
		type:LOGOUT
	})
}