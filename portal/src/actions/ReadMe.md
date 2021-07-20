Actions

Here are all of the actions related files. This and the reducers folder are all related to redux.

Action-Types:
	All of the actions that can be dispatched to the server, both timestamp and video. There are
	also actions for the notifications

Authenticate-Acitons:
	All actions related to the logging in of user, logout, and handling request that indicate permission
	of the user is invalid.
	All of these calls are made on the timestamp server, but b/c they are security related that are in their own folder.

General-actions:
	General actions helper for making calls; creating query params, handling on sucsess and failure of the http calls, ect. Future action related helpers should go here

Timestamp-Actions:
	All calls having to do with timestmap data(timestamp, episode, comipilation data, ect.) are made here. 

	There is also a timestamp-server-actions file. For sturucture clarity, here is the purpose of each:
		The *-actions files all handle the dispatch of the events for the store, mainly
		The *-server-actions handle making all of the server calls 

		The actions file will define onSucsess and onFailure commands for each call, then pass that callbacks to the *-server-action file method. Depending on the http call outcome, the callbacks are called

Video-actions:
	Like the timestamp-actions , but for the video server. Think getting unlinked videos, linked videos, createing compilation, linking unlinked vid to episode, getting logos, ect. 