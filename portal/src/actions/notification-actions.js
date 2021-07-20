import {
	API_NEW_REQUEST,
	API_REQUEST_ERROR,
	CLEAR_ALL_ERRORS,
	SUCSESS_INFO,
	RESET_SUCSESS_INFO
} from './action-types'


export var notifyApiError = (data) => dispatch => {
	dispatch({
		type: API_REQUEST_ERROR,
		payload: data
	})
}

export var newApiRequest = () => dispatch => {
	dispatch({
		type: API_NEW_REQUEST,
	})
}

export var clearErrors = () => dispatch => {
	dispatch({
		type: CLEAR_ALL_ERRORS,
	})
}

export var sucsessInfo = (data) => dispatch => {
	dispatch({
		type:SUCSESS_INFO,
		payload:data
	})
}

export var resetSucsessInfo = () => dispatch => {
	dispatch({
		type:RESET_SUCSESS_INFO
	})
}