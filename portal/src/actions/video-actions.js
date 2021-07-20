import { GET_LINKED_VIDEOS,GET_UNLINKED_VIDEOS,GET_LINK_TO_EPISODE,RESET_LINK_TO_EPISODE} from './action-types'

import { 
	getLinkedVideos as get_linkedVideos,
	getUnlinkedVideos as get_unlikedVideos,
	getLinkToEpisode as get_linkToEpisode} from './video-server-actions'

import {sucsessInfo} from './notification-actions'


export var getLinkedVideos = () => dispatch => {
	var onSucsess = (linked_videos) => {
		dispatch({
			type: GET_LINKED_VIDEOS,
			payload: linked_videos.videos.map(vid => parseInt(vid))
		})
	}

	get_linkedVideos(dispatch, onSucsess, /*onFailure=*/ () => {})
}

export var getUnlinkedVideos = () => dispatch => {
	var onSucsess = (unlinked_videos) => {
		dispatch({
			type: GET_UNLINKED_VIDEOS,
			payload: unlinked_videos.videos
		})
	}

	get_unlikedVideos(dispatch, onSucsess, /*onFailure=*/ () => {})
}

export var getLinkToEpisode = (data) => dispatch => {
	var onSucsess = (body) => {
		dispatch({
			type: GET_LINK_TO_EPISODE,
			payload: true
		})
		dispatch(sucsessInfo(data.unlinked_video + ' link to episode sucsessful !'))
		console.log('get link to episode SUCSESS')
	}

	var onFailure = () => {
		console.log('get link to episode FAIL')
	}
	console.log('vide-actions getLinkToEpisode')

	get_linkToEpisode(dispatch, onSucsess, onFailure,data)
	return Promise.resolve()
}

export var resetLinkToEpisode = () => dispatch => {
	dispatch({type:RESET_LINK_TO_EPISODE})
	return Promise.resolve()
}


