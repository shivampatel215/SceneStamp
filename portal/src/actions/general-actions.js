import {notifyApiError, newApiRequest} from './notification-actions'


export var httpsCall = (dispatch, url, options, onSucsess, onFailure, queryParams) => {

	if(queryParams){
		url += "?"
		Object.keys(queryParams).forEach(attr => {
			if(Array.isArray(queryParams[attr])) queryParams[attr] = queryParams[attr].join(',') 
			url += attr + '=' + queryParams[attr] + '&'
		})
		url = url.substring(0, url.length - 1);
	}


	dispatch(newApiRequest())
	fetch(url ,options).then(res => {
		if(!res.ok) res.json().then( data => {
			data.status = res.status
			dispatch(notifyApiError(data))
			return onFailure(data)
		})
		else return res.json().then(data => onSucsess(data))
	})
}