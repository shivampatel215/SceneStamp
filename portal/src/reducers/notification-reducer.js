import {
	API_NEW_REQUEST,
	API_REQUEST_ERROR,
	CLEAR_ALL_ERRORS,
	SUCSESS_INFO,
	RESET_SUCSESS_INFO
} from '../actions/action-types'

const initialState = {
	error:null,
	sucsess_info: null
};

function notificationReducer(state = initialState, action) {
	switch(action.type){
		case API_REQUEST_ERROR:
			return {
				...state,
				error:action.payload}
		case API_NEW_REQUEST:
			return {
				...initialState
			}
		case CLEAR_ALL_ERRORS:
			return {
				...initialState
			}
		case SUCSESS_INFO:
			return {
				...state,
				sucsess_info:action.payload
			}
		case RESET_SUCSESS_INFO:
			return {
				...state,
				sucsess_info:null
			}
		default:
			return state

	}
};

export default notificationReducer;