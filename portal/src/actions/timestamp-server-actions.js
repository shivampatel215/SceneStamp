import { httpsCall } from "./general-actions";

import store from "../store";

const TIMESTAMP_SERVER_URL = "https://scene-stamp-server.herokuapp.com";
//const TIMESTAMP_SERVER_URL = 'http://localhost:8081'

export var login = (dispatch, data, onSucsess, onFailure) => {
	var options = {
		headers: {
			username: data.username,
			password: data.password
		}
	};

	httpsCall(
		dispatch,
		TIMESTAMP_SERVER_URL+ "/login",
		options,
		onSucsess,
		onFailure
	);
};

export var getCompilationData = (dispatch, onSucsess, onFailure) => {
	timestampServerCall(
		dispatch,
		"/getCompilationData",
		onSucsess,
		onFailure
	);
};

export var getTimestampData = (dispatch, onSucsess, onFailure) => {
	timestampServerCall(
		dispatch,
		"/getTimestampData",
		onSucsess,
		onFailure
	);
};

export var getEpisodeData = (dispatch, onSucsess, onFailure) => {
	timestampServerCall(
		dispatch,
		"/getEpisodeData",
		onSucsess,
		onFailure
	);
};

export var getCharacterData = (dispatch, onSucsess, onFailure) => {
	timestampServerCall(
		dispatch,
		"/getCharacterData",
		onSucsess,
		onFailure
	);
};

export var getCategoryData = (dispatch, onSucsess, onFailure) => {
	timestampServerCall(
		dispatch,
		"/getCategoryData",
		onSucsess,
		onFailure
	);
};

var timestampServerCall = (dispatch, path, onSucsess, onFailure) => {
	var options = {
		headers: {
			test_mode: true,
			auth_token: store.getState().authenticate.local_auth_token
		}
	};

	httpsCall(dispatch, TIMESTAMP_SERVER_URL + path, options, onSucsess, onFailure);
};
