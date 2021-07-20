var assert = require('assert');
const expect = require('chai').expect;
var sinon = require('sinon')
var events = require('events')
var child_process = require('child_process')
var chai = require('chai')
var chaiHttp = require('chai-http');

var mockFs = require('mock-fs')
var fs = require('fs')
var nock = require('nock')

var action = require('../action')
var taskScript = require('../taskScript')
var cred = require('../credentials.js')
var auth = require('../auth')

sinon.stub(taskScript, 'initialTests').callsFake(callback => {
	callback()
})

//bypasses remove all of ip files, and also doesn't call the update tasks
sinon.stub(action, 'removeInProgressVideos').callsFake(() => {})

var server = require('../index').server

chai.use(chaiHttp);

describe('tests', function() {

	function assertErrorMessage(res, msg, custom) {
		expect((custom == true ? res.endStatus : res.status)).to.equal(500)
		expect((custom == true ? res.data : res.body)).to.have.property('error_message')
		expect((custom == true ? res.data : res.body).error_message).to.equal(msg)
	}


	function assertSuccess(res, post) {
		expect(res.status).to.equal((post ? 201 : 200))
	}


	function sendRequest(path, params, post, headers) {

		var addHeaders = req => {
			if (headers !== undefined) {
				Object.keys(headers).forEach(head => {
					req.set(head, headers[head])
				})
			}
			return req
		}

		return (post ?
			addHeaders(chai.request(server).post('/' + path).set('content-type', 'application/json')).send(params) :
			addHeaders(chai.request(server).get('/' + path + '?' + Object.keys(params).map(attr => {
				return attr + '=' + params[attr]
			}).join('&'))).send())

	}


	var sandbox;
	var mockFileSystemData;
	var fakeBaton;
	var mockEpisodeData;
	var existingTimestampParams;

	var universalCompilationId;


	var {
		ROOT_DIR,
		UNLINKED_FOLDER,
		LINKED_FOLDER,
		COMPILATION_FOLDER,
		BRANDING_FOLDER,
		SUB_TIMESTAMP_DURATION
	} = taskScript.getAllDirectories();

	function createSubTimestamps(ts, callback) {
		var subTimestamps = []
		ts.episode_name = ts.episode_id.toString() + '.mp4'
		while (ts.duration > SUB_TIMESTAMP_DURATION) {
			var data = {
				episode_id: ts.episode_id,
				start_time: ts.start_time,
				duration: SUB_TIMESTAMP_DURATION,
				episode_name: ts.episode_id.toString() + '.mp4',
			}
			if (ts.completed != undefined) data.completed = ts.completed
			subTimestamps.push(data)
			if (ts.duration > SUB_TIMESTAMP_DURATION) {
				ts.start_time += SUB_TIMESTAMP_DURATION
				ts.duration -= SUB_TIMESTAMP_DURATION
			}
		};
		subTimestamps.push(ts)
		callback(subTimestamps)
	}

	function createTasksFromTimestamp(timestamps, callback) {
		var newTimestamps = []
		let breakUp = timestamps.forEach(function(ts) {
			createSubTimestamps(ts, function(subTimestamps) {
				newTimestamps = newTimestamps.concat(subTimestamps)
				if (timestamps.indexOf(ts) == timestamps.length - 1) callback(newTimestamps)
			})
		})
	}

	function tasksForCompilation(params, callback) {
		createTasksFromTimestamp(params.timestamps, (newTasks) => {
			var costructedTask = {}
			costructedTask[params.compilation_id] = {
				timestamps: newTasks
			}
			if (params.logo) {
				costructedTask[params.compilation_id].branding = {
					logo: params.logo
				}
			}
			if (params.error) costructedTask[params.compilation_id].error = params.error
			callback(costructedTask)
		})
	}

	function createFakeBaton(params) {
		return action._getBaton('testAction', params, fakeRes)
	}

	beforeEach(function() {

		sandbox = sinon.createSandbox();


		taskScript._resetCurrentEditingTask()
		taskScript._resetCurrentDownloadTask();

		//repress the console.log 
		sandbox.stub(console, 'log').callsFake(() => {})

		fakeRes = {
			data: null,
			endStatus: null,
			status: function(endStatus) {
				this.endStatus = endStatus
				return this
			},
			json: function(data) {
				this.data = data;
			}
		}

		//req body to test the auth 
		//can't use the chai http , since we are not makking a endpoint call and simple calling a function 
		fakeReq = {
			headers: {},
			body: {},
			get(attr) {
				return this.headers[attr]
			}
		}

		//mock data create compilation params
		existingTimestampParams = {
			compilation_name: "InTest Existing Compilation",
			timestamps: [{
				episode_id: 1,
				start_time: 2,
				duration: 13,
				timestamp_id: 1
			}, {
				episode_id: 1,
				start_time: 10,
				duration: 20,
				timestamp_id: 1
			}]
		}

		//mock download youtube videos 
		existingDownloadYoutubeParams = {
			tasks: [{
				youtube_link: 'youtube_link',
				episode_id: "101"
			}]
		}

		const encodings = require('iconv-lite/encodings');

		//mock timestamp server calls

		//mock the timestamp episode data
		mockEpisodeData = [{
			episode_id: 0
		}, {
			episode_id: 1
		}, {
			episode_id: 2
		}, {
			episode_id: 3
		}]

		universalCompilationId = 1057

		function addUniversalCompilationId() {
			var data = JSON.parse(JSON.stringify(existingTimestampParams))
			data.compilation_id = universalCompilationId
			return data
		}

		//timestamp server validate
		sandbox.stub(auth, '_validateRequest').callsFake((baton, req, callback) => callback())

		//episode data
		nock('https://' + cred.TIMESTAMP_SERVER_URL).get('/getEpisodeData').reply(200, mockEpisodeData)

		nock('https://' + cred.TIMESTAMP_SERVER_URL).post('/newCompilation').reply(201, addUniversalCompilationId(existingTimestampParams))


		//mock the file system 
		mockFileSystemData = {
			'tasks.json': '{}',
			'download_tasks.json': '{\"tasks\":[]}'
		}

		mockFileSystemData[UNLINKED_FOLDER] = {
			'unlinked_vid_1.mp4': 'unlinked vid 1',
			'unlinked_vid_2.mp4': 'unlinked vid 2',
			'unlinked_vid_3.mp3': 'unlinked vid 3',
		}
		mockFileSystemData[LINKED_FOLDER] = {
			'0.mp4': 'episode 0 file ',
			'1.mp4': 'episode 1 file  ',
		}
		mockFileSystemData[COMPILATION_FOLDER] = {
			'compilation_vid_1.mp4': 'compilation 1 file ',
			'compilation_vid_2.mp4': 'compilation 2 file ',
		}
		mockFileSystemData[BRANDING_FOLDER] = {
			'test-brand-logo.png': 'test brand logo ',
		}

		mockFs(mockFileSystemData)

		function getDirAndFile(file) {
			var fileArray = file.split('/')
			var fileName = fileArray.pop();
			return [fileArray.join('/'), fileName]
		}

		//mocking the fs renaming 
		sandbox.stub(fs, 'rename').callsFake(function(oldFile, newFile, callback) {
			var oldInfo = getDirAndFile(oldFile)
			var newInfo = getDirAndFile(newFile)
			mockFileSystemData[newInfo[0]][newInfo[1]] = mockFileSystemData[oldInfo[0]][oldInfo[1]]
			delete mockFileSystemData[oldInfo[0]][oldInfo[1]]
			mockFs(mockFileSystemData)
			callback()
		})

		//mocking the fs writing to file  
		sandbox.stub(fs, 'writeFile').callsFake(function(file, content, callback) {
			var fileInfo = getDirAndFile(file)
			if (fileInfo[0] == ".") mockFileSystemData[fileInfo[1]] = content
			else mockFileSystemData[fileInfo[0]][fileInfo[1]] = content
			mockFs(mockFileSystemData)
			callback()
		})

	})

	afterEach(function() {
		sandbox.restore();
		mockFs.restore();
		nock.cleanAll()
	})

	it('check root', function() {
		expect(ROOT_DIR).to.equal('/home/ubuntu/')
	})

	context('validate for all requests', function() {

		var actionSpy;

		var sucValidate = () => {
			nock('https://' + cred.TIMESTAMP_SERVER_URL).matchHeader('test_mode', value => true).matchHeader('auth_token', value => true).get('/validate?action=getLinkedVideos').reply(200, {})
		}

		var failValidate = (err) => {
			nock('https://' + cred.TIMESTAMP_SERVER_URL).matchHeader('test_mode', value => true).matchHeader('auth_token', value => true).get('/validate?action=getLinkedVideos').reply(401, err)
		}

		beforeEach(() => {

			fakeBaton = createFakeBaton('getLinkedVideos')

			actionSpy = sinon.stub()
			//restore mock for _validateRequest
			auth._validateRequest.restore()

			sandbox.stub(action, 'get_allLinkedVides').callsFake((fakeBaton, params, res) => {
				actionSpy();
				fakeBaton.json('done')
			})
		})

		it('should pass validation and call action', (done) => {
			sucValidate()
			sendRequest('getLinkedVideos', {}, /*post=*/ false, {
				test_mode: true,
				auth_token: 'kjl'
			}).end((err, res, body) => {
				assertSuccess(res)
				expect(actionSpy.called).is.true;
				done()
			})
		})

		it('should fail validation', (done) => {
			var error = {
				id: 101,
				error_message: 'InTest Error'
			}
			failValidate(error)
			sendRequest('getLinkedVideos', {}, /*post=*/ false, {
				test_mode: true,
				auth_token: 'kjl'
			}).end((err, res, body) => {
				assertErrorMessage(res, error.error_message)
				expect(actionSpy.called).is.false;
				done()
			})
		})
	})

	context('file sytem api', function() {
		it('should get all unlinked videos', done => {
			sendRequest('getUnlinkedVideos', {}).end((err, res, body) => {
				assertSuccess(res)
				var files = []
				Object.keys(mockFileSystemData[UNLINKED_FOLDER]).forEach(function(key) {
					files.push(key.split('.')[0])
				});
				expect(res.body.videos).to.deep.equal(files)
				done()
			})
		})
		it('should get all linked videos', done => {
			sendRequest('getLinkedVideos', {}).end((err, res, body) => {
				assertSuccess(res)
				var files = []
				Object.keys(mockFileSystemData[LINKED_FOLDER]).forEach(function(key) {
					files.push(key.split('.')[0])
				});
				expect(res.body.videos).to.deep.equal(files)
				done()
			})
		})

		it('should get all compilation videos', done => {
			sendRequest('getCompilationVideos', {}).end((err, res, body) => {
				assertSuccess(res)
				var files = []
				Object.keys(mockFileSystemData[COMPILATION_FOLDER]).forEach(function(key) {
					files.push(key.split('.')[0])
				});
				expect(res.body.videos).to.deep.equal(files)
				done()
			})
		})

		it('should get all branding', done => {
			sendRequest('getLogos', {}).end((err, res, body) => {
				assertSuccess(res)
				var files = []
				Object.keys(mockFileSystemData[BRANDING_FOLDER]).forEach(function(key) {
					files.push(key.split('.')[0])
				});
				expect(res.body.logo_names).to.deep.equal(files)
				done()
			})
		})
	})

	context('linking episodes', function() {

		it('should link unlinked video to episode', function(done) {
			var unlinkedVideoName = Object.keys(mockFileSystemData[UNLINKED_FOLDER])[0]
			var params = {
				unlinked_video: unlinkedVideoName.split('.')[0],
				episode_id: mockEpisodeData[2].episode_id
			}
			var origFileContent = mockFileSystemData[UNLINKED_FOLDER][Object.keys(mockFileSystemData[UNLINKED_FOLDER])[0]]
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertSuccess(res)
				action._getAllUnlinkedVideos(fakeBaton, (linked_videos) => {
					expect(mockFileSystemData[UNLINKED_FOLDER][params.unlinked_video]).to.equal(undefined);
				})
				expect(res.body.episode_id_linked).to.equal(params.episode_id.toString());
				expect(mockFileSystemData[LINKED_FOLDER][params.episode_id + '.mp4']).to.equal(origFileContent)
				done()
			})
		})

		it('should throw for error in getEpisodeData call', function(done) {
			var error = {
				id: 101,
				error_message: 'InTest Timestamp Error'
			};
			nock.cleanAll()
			nock('https://' + cred.TIMESTAMP_SERVER_URL).get('/validate').reply(200, {})
			nock('https://' + cred.TIMESTAMP_SERVER_URL).get('/getEpisodeData').reply(500, error)
			var unlinkedVideoName = Object.keys(mockFileSystemData[UNLINKED_FOLDER])[0]
			var params = {
				unlinked_video: unlinkedVideoName.split('.')[0],
				episode_id: mockEpisodeData[2].episode_id
			}
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertErrorMessage(res, error.error_message)
				expect(res.body.id).to.equal(error.id)
				done()
			})
		})

		it('should throw for invalid unlinked video', function(done) {
			var unlinkedVideoName = 'Random Unlinked Video'
			var params = {
				unlinked_video: unlinkedVideoName,
				episode_id: mockEpisodeData[2].episode_id
			}
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params : unlinked video does not exist')
				done()
			})
		})

		it('should throw for invalid episode id', function(done) {
			var unlinkedVideoName = Object.keys(mockFileSystemData[UNLINKED_FOLDER])[0]
			var params = {
				unlinked_video: unlinkedVideoName.split('.')[0],
				episode_id: 101
			}
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params Episode Id: invalid id')
				done()
			})

		})

		it('should throw for already linked episode id', function(done) {
			var unlinkedVideoName = Object.keys(mockFileSystemData[UNLINKED_FOLDER])[0]
			var params = {
				unlinked_video: unlinkedVideoName.split('.')[0],
				episode_id: mockEpisodeData[0].episode_id
			}
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params Episode Id: already linked to video')
				done()
			})

		})

		it('should throw for unlinked video that is not in mp4 format', function(done) {
			var unlinkedVideoName = Object.keys(mockFileSystemData[UNLINKED_FOLDER])[2]
			var params = {
				unlinked_video: unlinkedVideoName.split('.')[0],
				episode_id: mockEpisodeData[2].episode_id
			}
			sendRequest('linkToEpisode', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params Unlinked Video: file must be in mp4 format')
				done()
			})

		})
	})

	context('download youtube video', function() {

		it('should update download task file with compilation tasks', function(done) {
			var params = existingDownloadYoutubeParams.tasks[0]

			sendRequest('downloadYoutubeVideo', params).end((err, res, body) => {
				assertSuccess(res)
				expect(res.body).to.deep.equal(params)
				expect(JSON.parse(mockFileSystemData['download_tasks.json']).tasks[0]).to.deep.equal(params)
				done()
			})
		})

		it('should throw for invalid youtube link', function(done) {
			var params = existingDownloadYoutubeParams.tasks[0]
			delete params.youtube_link

			sendRequest('downloadYoutubeVideo', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: youtube link')
				done()
			})
		})

		it('should throw for invalid episode id', function(done) {
			var params = existingDownloadYoutubeParams.tasks[0]
			delete params.episode_id

			sendRequest('downloadYoutubeVideo', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: episode id')
				done()
			})
		})

		it('should throw for already linked episode', function(done) {
			var params = existingDownloadYoutubeParams.tasks[0]
			params.episode_id = "0"

			sendRequest('downloadYoutubeVideo', params).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: episode already linked')
				done()
			})
		})

	})

	context('create compilations', function() {

		it('should update task file with compilation tasks', function(done) {
			var params = existingTimestampParams

			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				params.compilation_id = universalCompilationId
				tasksForCompilation(params, (content) => {
					assertSuccess(res, /*post=*/ true)
					expect(JSON.parse(mockFileSystemData['tasks.json'])[params.compilation_id]).to.deep.equal(content[params.compilation_id]);
					done()
				})
			})
		})

		it('should update task file with compilation tasks and branding', function(done) {
			var params = existingTimestampParams
			params.logo = "test-brand-logo"

			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				params.compilation_id = universalCompilationId
				tasksForCompilation(params, (content) => {
					expect(JSON.parse(mockFileSystemData['tasks.json'])[params.compilation_id]).to.deep.equal(content[params.compilation_id]);
					assertSuccess(res, /*post=*/ true)
					done()
				})
			})
		})

		it('with existing tasks, should update task file, with compilation tasks', function(done) {

			var params = existingTimestampParams

			function setUpExistingTasks(callback) {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}

			setUpExistingTasks(function(existingTaskContent) {
				sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
					tasksForCompilation(params, (content) => {
						var taskFileContent = JSON.parse(mockFileSystemData['tasks.json'])
						expect(taskFileContent[existingTimestampParams.compilation_id]).to.deep.equal(existingTaskContent[existingTimestampParams.compilation_id]);
						expect(taskFileContent[content.compilation_id]).to.deep.equal(content[content.compilation_id]);
						assertSuccess(res, /*post=*/ true)
						done()
					})
				})
			})
		})

		it('should throw invalid param; compilation name', function(done) {
			var params = existingTimestampParams
			delete params.compilation_name

			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: compilation name')
				done()
			})
		})

		it('should throw invalid param; timestamp missing', function(done) {
			var params = existingTimestampParams
			params.timestamps = []


			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: timestamps')
				done()
			})
		})

		it('should throw invalid param; invalid episode id', function(done) {
			var params = existingTimestampParams
			params.timestamps[0].episode_id = 101 //episode id not in linked folder

			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid Params: episode id not present on server')
				done()
			})
		})

		it('should throw invalid param; invalid logo', function(done) {
			var params = existingTimestampParams
			params.logo = "invalid-logo"

			sendRequest('createCompilation', params, /*post=*/ true).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid logo : logo name does not exist')
				done()
			})
		})
	})

	//compilation video status 

	context('compilation video status', function() {

		it('should get compilation video status (incomplete)', function(done) {

			existingTimestampParams.timestamps[0].completed = true
			existingTimestampParams.compilation_id = universalCompilationId

			function setUpExistingTasks(callback) {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}

			setUpExistingTasks(function() {
				sendRequest('getCompilationStatus', {
					compilation_id: existingTimestampParams.compilation_id
				}).end((err, res, body) => {
					assertSuccess(res)
					expect(res.body.completed).to.equal(false)
					expect(res.body.percentage).to.equal(0.5);
					done()
				})
			})
		})

		it('should get compilation video status (complete)', function(done) {

			existingTimestampParams.timestamps[0].completed = true
			existingTimestampParams.timestamps[1].completed = true
			existingTimestampParams.compilation_id = universalCompilationId


			function setUpExistingTasks(callback) {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}

			setUpExistingTasks(function() {
				sendRequest('getCompilationStatus', {
					compilation_id: existingTimestampParams.compilation_id
				}).end((err, res, body) => {
					assertSuccess(res)
					// even if the percentage is 100, we only update completed in the 'updateTask' taskScript function
					expect(res.body.completed).to.equal(false)
					expect(res.body.percentage).to.equal(1);
					done()
				})
			})
		})

		it('should get compilation video status with branding (incomplete)', function(done) {

			existingTimestampParams.timestamps[0].completed = true
			existingTimestampParams.timestamps[1].completed = true
			existingTimestampParams.compilation_id = universalCompilationId
			existingTimestampParams.logo = "test-brand-logo"

			function setUpExistingTasks(callback) {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}

			setUpExistingTasks(function() {
				sendRequest('getCompilationStatus', {
					compilation_id: existingTimestampParams.compilation_id
				}).end((err, res, body) => {
					assertSuccess(res)
					expect(res.body.completed).to.equal(false)
					expect(res.body.percentage).to.equal(2 / 3);
					done()
				})
			})
		})

		it('should get compilation video status with branding (complete)', function(done) {

			existingTimestampParams.timestamps[0].completed = true
			existingTimestampParams.timestamps[1].completed = true
			existingTimestampParams.compilation_id = universalCompilationId
			existingTimestampParams.logo = "test-brand-logo"

			function setUpExistingTasks(callback) {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					content[universalCompilationId].branding.completed = true
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}

			setUpExistingTasks(function() {
				sendRequest('getCompilationStatus', {
					compilation_id: existingTimestampParams.compilation_id
				}).end((err, res, body) => {
					assertSuccess(res)
					expect(res.body.completed).to.equal(false)
					expect(res.body.percentage).to.equal(1);
					done()
				})
			})
		})

		it('should throw invalid param; invalid compilation id', function(done) {

			var compilation_id = 111 //wrong compilation id
			sendRequest('getCompilationStatus', {
				compilation_id: existingTimestampParams.compilation_id
			}).end((err, res, body) => {
				assertErrorMessage(res, 'Invalid compilation id: compilation does not exist')
				done()
			})

		})

	})

	context('update task ', function() {

		async function runUpdateTasks(callback) {
			taskScript.updateTasks()
			setTimeout(callback, 100)
		}

		async function runUpdateDownloadTasks(callback) {
			taskScript.updateDownloadTask()
			setTimeout(callback, 100)
		}

		function setUpExistingTasks(callback) {

			if (Array.isArray(existingTimestampParams)) {
				var result = {}
				existingTimestampParams.forEach(timestampParams => {
					tasksForCompilation(JSON.parse(JSON.stringify(timestampParams)), function(content) {
						Object.keys(content).forEach(con => {
							result[con] = content[con]
							universalCompilationId += 1
						})
					})
					if (existingTimestampParams.indexOf(timestampParams) == existingTimestampParams.length - 1) {
						mockFileSystemData['tasks.json'] = JSON.stringify(result)
						mockFs(mockFileSystemData)
						callback(result)
						return
					}
				})
			} else {
				tasksForCompilation(JSON.parse(JSON.stringify(existingTimestampParams)), function(content) {
					mockFileSystemData['tasks.json'] = JSON.stringify(content)
					mockFs(mockFileSystemData)
					callback(content)
				})
			}
		}

		function setUpExistingDownloadTasks(callback) {
			mockFileSystemData['download_tasks.json'] = JSON.stringify(existingDownloadYoutubeParams)
			mockFs(mockFileSystemData)
			callback(existingDownloadYoutubeParams)
		}

		function setUpTasksAndRunUpdateTasks(callback) {
			setUpExistingTasks(tasks => {
				runUpdateTasks(function() {
					callback(tasks)
				});
			})
		}

		function setUpDownloaedTasksAndRun(callback) {
			setUpExistingDownloadTasks(tasks => {
				runUpdateDownloadTasks(function() {
					callback(tasks)
				});
			})
		}

		var videoCutSpy;
		var videoLogoSpy;
		var downloadVideoSpy;

		var childSpawnEmitter;

		function setUpSpawnEmitter() {
			childSpawnEmitter.stdout = new events.EventEmitter();
			childSpawnEmitter.stderr = new events.EventEmitter();
			childSpawnEmitter.kill = function() {
				console.log('process DEAD')
			}
			sandbox.stub(child_process, 'spawn').returns(childSpawnEmitter);
		}

		function emit(event, output) {
			if (event == 'error') childSpawnEmitter.stderr.emit('data', output)
			else childSpawnEmitter.stdout.emit('data', output);
		}

		beforeEach(function() {
			existingTimestampParams.timestamps[0].completed = true

			videoCutSpy = null
			videoLogoSpy = null;
			downloadVideoSpy = null;

			childSpawnEmitter = new events.EventEmitter();


			existingTimestampParams.compilation_id = universalCompilationId

		})

		function setUpSpy() {
			videoCutSpy = sandbox.stub(taskScript, '_callVideoCut').callsFake(function() {})
			videoLogoSpy = sandbox.stub(taskScript, '_callVideoLogo').callsFake(function() {})
			downloadVideoSpy = sandbox.stub(taskScript, '_callDownloadVideo').callsFake(function() {})
		}

		it('should run video cut on next incomplete task', function(done) {
			setUpSpy();

			setUpTasksAndRunUpdateTasks((tasks) => {
				var timestampTask = tasks[existingTimestampParams.compilation_id].timestamps.find(function(task) {
					return !task.completed
				})
				expect(videoCutSpy.calledOnce).to.equal(true)
				expect(taskScript._getCurrentEditingTask()).to.equal(existingTimestampParams.compilation_id.toString())
				expect(videoCutSpy.getCall(0).args).to.deep.equal([timestampTask.episode_id.toString() + '.mp4', existingTimestampParams.compilation_id.toString(), timestampTask.start_time, timestampTask.duration, tasks[existingTimestampParams.compilation_id].timestamps.indexOf(timestampTask)])
				done()
			})
		})

		it('should run video logo on next incomplete task, and not run next editing task for another compilation', function(done) {
			setUpSpy();
			existingTimestampParams.timestamps[1].completed = true
			existingTimestampParams.logo = "test-brand-logo"

			//mock for new compilation request
			anotherTimestampParam = {
				compilation_name: "InTest Existing Compilation",
				timestamps: [{
					episode_id: 1,
					start_time: 2,
					duration: 13,
					timestamp_id: 1
				}, {
					episode_id: 1,
					start_time: 10,
					duration: 20,
					timestamp_id: 1
				}]
			}
			existingTimestampParams = [existingTimestampParams, anotherTimestampParam]

			var comp_id_1 = universalCompilationId
			var comp_id_2 = universalCompilationId+ 1

				existingTimestampParams[0].compilation_id = comp_id_1
			existingTimestampParams[1].compilation_id = comp_id_2

			setUpTasksAndRunUpdateTasks((tasks) => {
				var timestampTask = tasks[comp_id_1].timestamps.find(function(task) {
					return !task.completed
				})
				expect(videoLogoSpy.calledOnce).to.equal(true)
				expect(taskScript._getCurrentEditingTask()).to.equal(comp_id_1.toString())
				expect(videoLogoSpy.getCall(0).args).to.deep.equal([comp_id_1.toString(), "test-brand-logo"])

				expect(JSON.parse(mockFileSystemData['tasks.json'])[comp_id_2]).to.not.equal(undefined)
				done()
			})
		})

		it('should run download video on next incomplete task', function(done) {
			setUpSpy();

			setUpDownloaedTasksAndRun((download_tasks) => {
				var downloadTask = download_tasks.tasks[0]
				expect(downloadVideoSpy.calledOnce).to.equal(true)
				expect(taskScript._getCurrentDownloadTask()).to.equal(downloadTask.episode_id)
				expect(downloadVideoSpy.getCall(0).args).to.deep.equal([downloadTask.youtube_link, downloadTask.episode_id])
				done()
			})
		})


		it('should not run next create compilation task, since error exists ', function(done) {
			setUpSpy();
			existingTimestampParams.error = 'InTest Error'

			setUpTasksAndRunUpdateTasks(function(tasks) {
				expect(videoCutSpy.calledOnce).to.equal(false)
				expect(taskScript._getCurrentEditingTask()).to.not.equal(existingTimestampParams.compilation_id.toString())
				done()
			})
		})

		it('should not run next download youtube task, since error exists ', function(done) {
			setUpSpy();
			existingDownloadYoutubeParams.tasks[0].error = 'InTest Error'

			setUpDownloaedTasksAndRun(function(download_tasks) {
				expect(downloadVideoSpy.calledOnce).to.equal(false)
				expect(taskScript._getCurrentDownloadTask()).to.equal(null)
				done()
			})
		})

		it('should not run video cut on next incomplete task, when compilation creation currently running', function(done) {
			setUpSpy();
			taskScript._setCurrentEditingTask(existingTimestampParams.compilation_id.toString())

			setUpTasksAndRunUpdateTasks((tasks) => {
				expect(videoCutSpy.calledOnce).to.equal(false)
				done()
			});
		})

		it('should not run download video on next incomplete task, when download video currently running', function(done) {
			setUpSpy();
			taskScript._setCurrentDownloadTask(existingDownloadYoutubeParams.tasks[0].episode_id)

			setUpDownloaedTasksAndRun((download_tasks) => {
				expect(downloadVideoSpy.calledOnce).to.equal(false)
				done()
			});
		})

		it('should remove task whose all timestamps are complete', function(done) {
			setUpSpy();
			existingTimestampParams.timestamps[1].completed = true

			setUpTasksAndRunUpdateTasks((tasks) => {
				expect(videoCutSpy.calledOnce).to.equal(false)
				expect(JSON.parse(mockFileSystemData['tasks.json'])[existingTimestampParams.compilation_name]).to.equal(undefined)
				done()
			})
		})

		it('should update the task file after video cut is finished', function(done) {
			setUpSpawnEmitter();
			setUpTasksAndRunUpdateTasks((tasks) => {
				var indexOfTaskToBeCompleted = tasks[existingTimestampParams.compilation_id].timestamps.indexOf(tasks[existingTimestampParams.compilation_id].timestamps.find(function(task) {
					return !task.completed
				}))
				var currentTaskCompletion = () => {
					return JSON.parse(mockFileSystemData['tasks.json'])[existingTimestampParams.compilation_id].timestamps[indexOfTaskToBeCompleted].completed
				}
				expect(currentTaskCompletion()).to.not.equal(true);
				childSpawnEmitter.emit('exit');
				setTimeout(() => {
					expect(currentTaskCompletion()).to.equal(true);
					done()
				}, 20)


			})
		})

		it('should update the task file after video logo is finished', function(done) {
			setUpSpawnEmitter();
			existingTimestampParams.timestamps[1].completed = true
			existingTimestampParams.logo = "test-brand-logo"

			setUpTasksAndRunUpdateTasks((tasks) => {

				var brandingTaskCompletion = () => {
					return JSON.parse(mockFileSystemData['tasks.json'])[existingTimestampParams.compilation_id].branding.completed
				}
				expect(brandingTaskCompletion()).to.not.equal(true);
				childSpawnEmitter.emit('exit');
				setTimeout(() => {
					expect(brandingTaskCompletion()).to.equal(true);
					done()
				}, 20)
			})
		})

		it('should update the download task file after download video is finished', function(done) {
			setUpSpawnEmitter();

			setUpDownloaedTasksAndRun((tasks) => {

				var downloadTasks = () => {
					return JSON.parse(mockFileSystemData['download_tasks.json']).tasks
				}
				expect(downloadTasks().length).to.equal(1);
				childSpawnEmitter.emit('exit');
				setTimeout(() => {
					expect(downloadTasks().length).to.equal(0);
					done()
				}, 20)
			})
		})

		it('should update the task file with messages and error after video cut throws error', function(done) {
			setUpSpawnEmitter();
			setUpTasksAndRunUpdateTasks((tasks) => {
				var currentTaskError = () => {
					return JSON.parse(mockFileSystemData['tasks.json'])[existingTimestampParams.compilation_id].error
				}
				expect(currentTaskError()).to.equal(undefined);
				emit('data', 'InTest Data')
				emit('error', 'InTest Error')
				setTimeout(() => {
					expect(currentTaskError().messages).to.contain('InTest Data')
					expect(currentTaskError().err).to.contain('InTest Error');
					done()
				}, 20)

			})
		})

		it('should update the download task file with messages and error after download youtube throws error', function(done) {
			setUpSpawnEmitter();
			setUpDownloaedTasksAndRun((tasks) => {
				var currentDownloadTask = () => {
					return JSON.parse(mockFileSystemData['download_tasks.json']).tasks[0].error
				}
				expect(currentDownloadTask()).to.equal(undefined);
				emit('data', 'InTest Data')
				emit('error', 'InTest Error')
				setTimeout(() => {
					expect(currentDownloadTask().messages).to.contain('InTest Data')
					expect(currentDownloadTask().err).to.contain('InTest Error');
					done()
				}, 20)

			})
		})

	})
})