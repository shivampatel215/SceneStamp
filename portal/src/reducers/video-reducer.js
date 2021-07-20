import {
	GET_LINKED_VIDEOS,GET_UNLINKED_VIDEOS,GET_LINK_TO_EPISODE,RESET_LINK_TO_EPISODE
} from "../actions/action-types";

const initialState = {
	linked_videos: [],
	unlinked_videos:[],
	link_to_episode:null
};

function videoReducer(state = initialState, action) {
	switch (action.type) {
		case GET_LINKED_VIDEOS:
			return {
				...state,
				linked_videos: action.payload
			};
		case GET_UNLINKED_VIDEOS:
			return {
				...state,
				unlinked_videos: action.payload
			};
		case GET_LINK_TO_EPISODE:
			return {
				...state,
				link_to_episode: action.payload

			}
		case RESET_LINK_TO_EPISODE:
			return {
				...state,
				link_to_episode: null

			}
		default:
			return state;
	}
}

export default videoReducer;
