import { httpsCall } from "./general-actions";

import store from "../store";

const VIDEO_SERVER_URL =
  "http://ec2-3-135-195-36.us-east-2.compute.amazonaws.com:8081";
//const VIDEO_SERVER_URL = 'http://localhost:8081'

export var getLinkedVideos = (dispatch, onSucsess, onFailure) => {
  videoServerCall(dispatch, "/getLinkedVideos", onSucsess, onFailure);
};

export var getUnlinkedVideos = (dispatch, onSucsess, onFailure) => {
  videoServerCall(dispatch, "/getUnlinkedVideos", onSucsess, onFailure);
};

export var getLinkToEpisode = (dispatch, onSucsess, onFailure, queryParams) => {
  console.log("vsa getLinkToEpisode");
  console.log(queryParams);
  videoServerCall(
    dispatch,
    "/linktoEpisode",
    onSucsess,
    onFailure,
    queryParams
  );
};

var videoServerCall = (dispatch, path, onSucsess, onFailure, queryParams) => {
  var options = {
    headers: {
      test_mode: true,
      auth_token: store.getState().authenticate.local_auth_token
    }
  };

  httpsCall(
    dispatch,
    VIDEO_SERVER_URL + path,
    options,
    onSucsess,
    onFailure,
    queryParams
  );
};
