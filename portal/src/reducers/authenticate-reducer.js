import {
	GET_LOCAL_AUTH_TOKEN,
	LOGIN_USER,
	LOGIN_REQUEST_STATUS,
	LOGOUT
} from '../actions/action-types'

const initialState = {
	local_auth_token: undefined,
	attempting_login:false,
};

function authenticateReducer(state = initialState, action) {
	switch(action.type){
		case GET_LOCAL_AUTH_TOKEN:
			return {
				...state,
				local_auth_token:action.payload}
		case LOGIN_REQUEST_STATUS:
			return {
				...state,
				attempting_login:action.payload
			}
		case LOGIN_USER:
			return {
				...state,
				local_auth_token: action.payload
			}
		case LOGOUT:
			return {
				...initialState
			}
		default:
			return state

	}
};

export default authenticateReducer;