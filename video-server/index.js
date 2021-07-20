var express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors')

var action = require('./action.js')
var taskScript = require('./taskScript.js')
var auth = require('./auth')

var app = express();
app.options('*', cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));


var endpoints = [{
		//will rename episode to new  
		url: 'linkToEpisode',
		action:'get_linkVideoToEpisode'
	}, {
		url: 'getUnlinkedVideos',
		action: 'get_allUnlinkedVideos'
	}, {
		url: 'getLinkedVideos',
		action: 'get_allLinkedVides'
	}, 
	 {
		url: 'getLogos',
		action: 'get_allLogos'
	},{
		url: 'createCompilation',
		action: 'get_CreateCompilation',
		post: true
	}, {
		//gets al list of all of the compilation video names 
		url: 'getCompilationVideos',
		action: 'get_allCompilationVideos'
	}, {
		//gets status of a compilation video 
		url: 'getCompilationStatus',
		action:'get_CompilationVideoStatus'
	}, {
		//will call res.download to the compilation video file 
		url: 'downloadCompilation',
		action: 'get_downloadCompilation'
	},
	{
		url: 'downloadYoutubeVideo',
		action:'get_downloadYoutbeVideo'
	}

]

app.all('*', function(req, res, next) {
	var origin = req.get('origin');
	res.header('Access-Control-Allow-Origin', origin);
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});


endpoints.forEach(function(endpoint) {

	var endpointFunction = function(req, res) {
		var params = (endpoint.post ? req.body : req.query)
		var baton = action._getBaton(endpoint.url, params, res)
		if (endpoint.post) baton.requestType = 'POST'
		auth._validateRequest(baton, req, function() {
			action[endpoint.action](baton, params, res);
		})
	}
	if (endpoint.post) {
		app.post('/' + endpoint.url, endpointFunction);
		return
	}
	app.get('/' + endpoint.url, endpointFunction);

})

var server = app.listen(process.env.PORT || 8081, function() {
	console.log("Scene Stamp Video Server Running @ port ", this.address().port)

	function taskLoop() {
		var loop;
		action.removeInProgressVideos(function() {
			loop = setInterval(function() {
				taskScript.updateTasks()
				taskScript.updateDownloadTask()
			}, 2000);
		})

	}
	
	taskScript.initialTests(err => {
		if (err) {
			console.log('Did not start server')
			server.close()
			return 
		}
		taskLoop();
	})
})

module.exports = {
	server:server
}
