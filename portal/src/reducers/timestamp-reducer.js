import {
	GET_COMPILATION_DATA,
	GET_TIMESTAMP_DATA,
	GET_EPISODE_DATA,
	GET_CHARACTER_DATA,
	GET_CATEGORY_DATA
} from "../actions/action-types";

const initialState = {
	compilation_data: [],
	timestamp_data: [],
	episode_data: [],
	character_data:[],
	category_data: []
};

function timestampReducer(state = initialState, action) {
	switch (action.type) {
		case GET_COMPILATION_DATA:
			return {
				...state,
				compilation_data: action.payload
			};
		case GET_TIMESTAMP_DATA:
			return {
				...state,
				timestamp_data: action.payload
			};
		case GET_EPISODE_DATA:
			return {
				...state,
				episode_data: action.payload
			};
		case GET_CHARACTER_DATA:
			return {
				...state,
				character_data: action.payload
			};
		case GET_CATEGORY_DATA:
			return {
				...state,
				category_data: action.payload
			};
		default:
			return state;
	}
}

export default timestampReducer;
