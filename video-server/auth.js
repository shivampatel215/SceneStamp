var https = require('https')

var action = require('./action')
var cred = require('./credentials')


module.exports = {

	_validateRequest(baton, req, suc_callback) {
		var t = this;
		baton.addMethod('_validateRequest')

		var createHeaders = () =>{
			var headers = {}
			if (req.get('test_mode')) headers.test_mode = req.get('test_mode')
			if (req.get('auth_token')) headers.auth_token = req.get('auth_token')
			return headers
		}

		var options = {
			hostname: cred.TIMESTAMP_SERVER_URL,
			path: '/validate?action='+baton.methods[0],
			method: 'GET',
			port: 443,
			headers: createHeaders()
		}

		var validateReq = https.request(options, function(res) {
			res.on('data', function(data) {
				var parsedData = JSON.parse(Buffer.from(data).toString());
				if (res.statusCode == 200) {
					suc_callback()
				} else {
					baton.setError(parsedData)
					baton.throwError(true /*keepErrorMessage*/ )
					return
				}
			});
		}).on('error', function(err) {
			baton.setError(err)
			action._generateError(baton)
			return
		})
		validateReq.end()
	}
}