import { GET_COMPILATION_DATA, GET_TIMESTAMP_DATA, GET_EPISODE_DATA,GET_CHARACTER_DATA, GET_CATEGORY_DATA } from './action-types'

import { 
	getCompilationData as get_compilationData,
 	getTimestampData as get_TimesatampData,
 	getEpisodeData as get_EpisodeData,
	getCharacterData as get_CharacterData,
	getCategoryData as get_CategoryData} from './timestamp-server-actions'



export var getCompilationData = () => dispatch => {
	var onSucsess = (compilation_data) => {

		dispatch({
			type: GET_COMPILATION_DATA,
			payload: compilation_data
		})
	}


	get_compilationData(dispatch, onSucsess, /*onFailure=*/ () => {})
}


export var getTimestampData = () => dispatch => {
	var onSucsess = (timestamp_data) => {

		dispatch({
			type: GET_TIMESTAMP_DATA,
			payload: timestamp_data
		})
	}

	get_TimesatampData(dispatch, onSucsess, /*onFailure=*/ () => {})
}

export var getEpisodeData = () => dispatch => {
	var onSucsess = (episode_data) => {

		dispatch({
			type: GET_EPISODE_DATA,
			payload: episode_data
		})
	}

	get_EpisodeData(dispatch, onSucsess, /*onFailure=*/ () => {})
}

export var getCharacterData = () => dispatch => {
	var onSucsess = (character_data) => {

		dispatch({
			type: GET_CHARACTER_DATA,
			payload: character_data
		})
	}

	get_CharacterData(dispatch, onSucsess, /*onFailure=*/ () => {})
}

export var getCategoryData = () => dispatch => {
	var onSucsess = (category_data) => {

		dispatch({
			type: GET_CATEGORY_DATA,
			payload: category_data
		})
	}

	get_CategoryData(dispatch, onSucsess, /*onFailure=*/ () => {})
}
