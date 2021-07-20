var fs = require('fs')
var async = require('async')

const child_process = require('child_process')

var TASK_FILE_PATH = './tasks.json'
var DOWNLOAD_TASK_FILE_PATH = './download_tasks.json'

//var ROOT_DIR = '/Users/kunal/Desktop/SSV/'
var ROOT_DIR = '/home/ubuntu/'

var UNLINKED_FOLDER = ROOT_DIR + 'unlinkedVideos'
var LINKED_FOLDER = ROOT_DIR + 'episodeVideos'
var COMPILATION_FOLDER = ROOT_DIR + 'compilationVideos'
var BRANDING_FOLDER = ROOT_DIR + 'branding'

var DOWNLOAD_VIDEO_FILE = 'download_yt.py'
var VIDEO_CUT_FILE = 'video_cut.py'
var VIDEO_LOGO_FILE = 'video_logo.py'
var TEST_PYTHON_FILE = 'testPython.py'

var currentEditingTask = null

var SUB_TIMESTAMP_DURATION = 100

//only one video will get downloaded at a time
var currentDownloadTask = null

/**
Python Child Processes - How they work

General Flow:
	-When a compilation video needs to be created, the empty file is created, and the 'task.json' file is updated to have the compilation_id and timestamps to add
		-all done during the api call
	-in interval in server, the 'updateTasks' is called
		-will read the tasks.json file ; if there are any new tasks, it will start creating the new comp video
		-process to create the comp video:
			0)the currentEditingTask var in this file will include the comp_id
				-indicated that specified compilation video is being created
			1)A timestamp is read form the comp_id in the tasks.json
			2)The python script is called to append the timestamp(section with start time and duration) to the empty comp_video file
			3)At the end, the timestamp will get new attr 'completed' = true
			4)The next timestamp is read, goto step 2
			5)once all timestamps have 'completed' attr, the comp_id is removed from tasks.json
		-in case the server stops while creating compilation video , there is an incomplete compilation video
			1)'updateTasks' will still get called , the first time will pass special flag
				-will get the total duration allready added by summing durations of all timestamps with completed 
			2)total complete duration will be passed to video_cut  , will remove all frames added by the last timestamp it was adding
			3) resume as normal, step 2 from above
		-in case error occurs from video_cut
			1) in 'tasks.json', comp_id will have attr 'error': err
			2) when 'updateTasks' is called, will not start process if error exists
*/

module.exports = {

	CURRENT_EDITING_TASK: currentEditingTask,

	ROOT_DIR: ROOT_DIR,
	VIDEO_CUT_FILE: VIDEO_CUT_FILE,
	VIDEO_LOGO_FILE: VIDEO_LOGO_FILE,


	//current tasks helper
	_getCurrentEditingTask() {
		return currentEditingTask
	},
	_resetCurrentEditingTask() {
		currentEditingTask = null;
	},
	_setCurrentEditingTask(compilation_id) {
		currentEditingTask = compilation_id
	},

	//current download task helper
	_getCurrentDownloadTask() {
		return currentDownloadTask
	},
	_resetCurrentDownloadTask() {
		currentDownloadTask = null
	},
	_setCurrentDownloadTask(episode_id) {
		currentDownloadTask = episode_id
	},

	setRoot(root){
		ROOT_DIR = root
	},

	//above methods needed for testing purposes ONLY

	getAllDirectories() {
		return {
			ROOT_DIR,
			UNLINKED_FOLDER,
			LINKED_FOLDER,
			COMPILATION_FOLDER,
			BRANDING_FOLDER,
			TASK_FILE_PATH,
			DOWNLOAD_TASK_FILE_PATH,
			SUB_TIMESTAMP_DURATION
		}
	},

	updateDownloadTask() {
		var t = this

		function startDownloadTask(youtube_link, episode_id) {
			console.log('youtube link ' + youtube_link + ' downlaod for : ' + episode_id)
			console.log()
			currentDownloadTask = episode_id
			t._callDownloadVideo(youtube_link, episode_id)
		}

		this._readDownloadTaskFile(function(download_tasks) {
			if (currentDownloadTask == null && download_tasks.tasks.length > 0) {
				var task = download_tasks.tasks.find(task => {
					return task.error == undefined
				})
				if (task !== undefined) startDownloadTask(task.youtube_link, task.episode_id)
			}
		})

	},

	updateTasks() {
		var t = this

		function checkTimestamps(tasks, comp_id, callback) {
			var timestamps = tasks[comp_id].timestamps
			if (timestamps.filter(function(ts) {
					return ts.completed != true
				}).length == 0) {
				callback()
				return
			} else {
				for (var i = 0; i < timestamps.length; i++) {
					if (!timestamps[i].completed) {
						var ts = timestamps[i]
						t._setCurrentEditingTask(comp_id)
						console.log('compilation started for timestamp : ' + comp_id)
						console.log()
						t._callVideoCut(ts.episode_name, comp_id, ts.start_time, ts.duration, i)
						break
					}
				}
			}
		}

		function checkBranding(tasks, comp_id, callback) {
			if (tasks[comp_id].branding !== undefined) {
				if (tasks[comp_id].branding.completed !== true) {
					t._setCurrentEditingTask(comp_id)
					console.log('compilation started for logo : ' + comp_id)
					console.log()
					t._callVideoLogo(comp_id, tasks[comp_id].branding.logo)
					return
				} else {
					callback()
				}
			} else {
				callback()
			}
		}

		function startTask(tasks, comp_id) {
			checkTimestamps(tasks, comp_id, function() {
				checkBranding(tasks, comp_id, function() {
					t._updateRemoveCompFromTask(comp_id)
				})
			})
		}

		this._readTaskFile(function(tasks) {
			if(currentEditingTask === null){
				var firstAvaliableCompilation = Object.keys(tasks).find(function(task) {
					return tasks[task].error == undefined
				});
				if(firstAvaliableCompilation !== undefined){
					startTask(tasks, firstAvaliableCompilation)
				}
			}
		})
	},

	_readDownloadTaskFile(callback) {
		var t = this;
		fs.readFile(DOWNLOAD_TASK_FILE_PATH, function(err, data) {
			if (err) {
				t._throwError({
					err: err.toString(),
					details: "Cannot read the download task file ",
					task_file: TASK_FILE_PATH,
					public_message: 'Internal Error :  Could not put video download in queue'
				})
				return
			} else callback((data == '' ? JSON.parse('{\"tasks\":[]}') : JSON.parse(data)))
		})
	},


	_readTaskFile(callback) {
		var t = this;
		fs.readFile(TASK_FILE_PATH, function(err, data) {
			if (err) {
				t._throwError({
					err: err.toString(),
					details: "Cannot read the task file ",
					task_file: TASK_FILE_PATH,
					public_message: 'Internal Error :  Could not put compilation video creation in queue'
				})
				return
			} else callback((data == '' ? JSON.parse('{}') : JSON.parse(data)))
		})
	},

	_updateDownloadTaskFile(data, callback) {
		var t = this;
		fs.writeFile(DOWNLOAD_TASK_FILE_PATH, JSON.stringify(data, undefined, 2), function(err) {
			if (err) {
				t._throwError({
					err: err.toString(),
					details: "Cannot read the download task file ",
					task_file: TASK_FILE_PATH,
					public_message: 'Internal Error :  Could not update the download task file'
				})
				return
			} else callback()
		})
	},

	_updateTaskFile(data, callback) {
		var t = this;
		fs.writeFile(TASK_FILE_PATH, JSON.stringify(data, undefined, 2), function(err) {
			if (err) {
				t._throwError({
					err: err.toString(),
					details: "Cannot read the task file ",
					task_file: TASK_FILE_PATH,
					public_message: 'Internal Error :  Could not put compilation video creation in queue'
				})
				return
			} else callback()
		})
	},

	_updateRemoveCompFromTask(comp_id) {
		var t = this;
		t._readTaskFile(function(tasks) {
			if(tasks[comp_id]){
				delete tasks[comp_id]
				t._updateTaskFile(tasks, function() {
					console.log("Completed Compilation Creation : " + comp_id)
				})
			}
		})
	},

	_updateErrorWithinDownloadTasks(episode_id, err) {
		var t = this;
		t._readDownloadTaskFile(function(download_tasks) {
			var index = download_tasks.tasks.findIndex(task => {
				return task.episode_id == episode_id
			})
			download_tasks.tasks[index].error = err
			t._updateDownloadTaskFile(download_tasks, function() {
				currentDownloadTask = null
			})
		})
	},

	_updateErrorWithinTasks(comp_id, err) {
		var t = this;
		t._readTaskFile(function(tasks) {
			tasks[comp_id].error = err
			t._updateTaskFile(tasks, function() {
				currentEditingTask = null
			})
		})
	},

	_updateDownloadVideoToComplete(episode_id, callback) {
		var t = this;
		t._readDownloadTaskFile(function(download_tasks) {
			var index = download_tasks.tasks.findIndex(task => {
				return task.episode_id == episode_id
			})
			download_tasks.tasks.splice(index, 1)
			t._updateDownloadTaskFile(download_tasks, function() {
				console.log("Finish Downloading Youtbe video " + episode_id)
				callback()
			})
		})

	},

	_updateTimestampToComplete(comp_id, indexOfTimestamp, callback) {
		var t = this;
		t._readTaskFile(function(tasks) {
			tasks[comp_id].timestamps[indexOfTimestamp].completed = true
			t._updateTaskFile(tasks, function() {
				console.log("Finished adding timestamp # " + indexOfTimestamp + " to compilation video " + comp_id)
				callback()
			})
		})

	},

	_updateBrandingToComplete(comp_id, logo, callback) {
		var t = this;
		t._readTaskFile(function(tasks) {
			tasks[comp_id].branding.completed = true
			t._updateTaskFile(tasks, function() {
				console.log("Finished adding branding logo " + logo + " to compilation video " + comp_id)
				callback()
			})
		})

	},

	_callDownloadVideo(youtube_link, episode_id) {
		var t = this;
		var pythonMessages = []

		function onError(err) {
			t._updateErrorWithinDownloadTasks(episode_id, {
				messages: pythonMessages,
				err: err
			})
		}

		function onData(data) {
			pythonMessages.push(data)
		}

		function onExit() {
			t._updateDownloadVideoToComplete(episode_id, function() {
				currentDownloadTask = null
			})
		}
		t._runPythonScript(DOWNLOAD_VIDEO_FILE, [youtube_link, LINKED_FOLDER + '/', episode_id], onData, onError, onExit)

	},

	_callVideoCut(source_file, compilation_video, start_time, duration, indexOfTimestamp) {
		var t = this;
		var pythonMessages = []
		var comp_id = compilation_video.split('.')[0]

		function onError(err) {
			t._updateErrorWithinTasks(comp_id, {
				messages: pythonMessages,
				err: err
			})
		}

		function onData(data) {
			pythonMessages.push(data)
		}

		function onExit() {
			t._updateTimestampToComplete(comp_id, indexOfTimestamp, function() {
				currentEditingTask = null
			})
		}

		t._runPythonScript(VIDEO_CUT_FILE, [LINKED_FOLDER + "/" + source_file, COMPILATION_FOLDER + '/' + compilation_video, start_time, duration], onData, onError, onExit)
	},

	_callVideoLogo(compilation_video, logo_name) {
		var t = this;
		var pythonMessages = []
		var comp_id = compilation_video.split('.')[0]

		function onError(err) {
			t._updateErrorWithinTasks(comp_id, {
				messages: pythonMessages,
				err: err
			})
		}

		function onData(data) {
			pythonMessages.push(data)
		}

		function onExit() {
			t._updateBrandingToComplete(comp_id, logo_name, function() {
				currentEditingTask = null
			})
		}

		t._runPythonScript(VIDEO_LOGO_FILE, [COMPILATION_FOLDER + '/' + compilation_video + '.mp4', BRANDING_FOLDER + '/' + logo_name + '.png'], onData, onError, onExit)
	},

	_runPythonScript(file, args, onData, onError, onExit) {
		var t = this;

		var spawnProcess;
		var errorOccured = false;

		function handleError(err) {
			spawnProcess.kill()
			t._throwError({
				err: err
			})
			onError(err)
		}

		function bufferToString(buffer) {
			return Buffer.from(buffer).toString()
		}


		function run() {
			spawnProcess = child_process.spawn('python', [file].concat([...args]), {
				stdio: ['pipe', 'pipe']
			});

			spawnProcess.stdout.on(
				'data',
				(data) => {
					onData(bufferToString(data))
				}
			);

			spawnProcess.stderr.on(
				'data',
				(data) => {
					errorOccured = true
					handleError(bufferToString(data))
				}
			);

			spawnProcess.on('exit', (code, signal) => {
				spawnProcess.kill();
				if (!errorOccured) onExit()
			});
		}

		try {
			run()
		} catch (e) {
			handleError(e)
		}
	},

	//unless all the timestamps are done, and 'updateTasks' has removed the timestamp tasks from the file, the completed task is 'false'
	getStatus(comp_id, callback) {
		var t = this;

		t._readTaskFile(function(tasks) {
			if (tasks[comp_id] == undefined) {
				callback({
					completed: true
				})
			} else {
				var task = tasks[comp_id]
				if (task.error) {
					callback({
						completed: false,
						error: task.error
					})
					return
				}
				var countCompleted = task.timestamps.filter(function(ts) {
					return ts.completed == true
				}).length
				var totalTasks = task.timestamps.length
				if (task.branding !== undefined) {
					totalTasks++;
					countCompleted += (task.branding.completed == true ? 1 : 0)
				}
				callback({
					completed: false,
					percentage: countCompleted / totalTasks
				})
			}
		})
	},


	_throwError(data) {
		console.log('----AUTOMATED------')
		console.log(data)
		console.log('\n')
	},

	initialTests(callback) {

		this.callTestPythonScript(error => {
			if (!error) {
				this.checkDirectories(error => {
					callback(error)
				})
				return
			}
			callback(error)
		})

	},

	checkDirectories(suc_callback) {

		var tasks = []

		function checkDirExists(dir, callback) {
			fs.access(dir, error => {
				callback(error)
			})
		}

		tasks.push(function(callback) {
			checkDirExists(UNLINKED_FOLDER, callback);
		})
		tasks.push(function(callback) {
			checkDirExists(LINKED_FOLDER, callback);
		})
		tasks.push(function(callback) {
			checkDirExists(COMPILATION_FOLDER, callback);
		})
		tasks.push(function(callback) {
			checkDirExists(BRANDING_FOLDER, callback);
		})

		async.parallel(tasks,
			err => {
				if (err) {
					this._throwError(err)
					suc_callback(err)
					return
				}
				suc_callback()
			})
	},

	/**
	 * Call to test python can run on server
	 * Will run before loops run on the server 
	 */

	callTestPythonScript(callback) {
		var t = this;
		var pythonMessages = []

		function onError(err) {
			console.log('error occured' + err)
			callback(err)
		}

		function onData(data) {
			pythonMessages.push(data)
		}

		function onExit() {
			callback()
		}

		t._runPythonScript(TEST_PYTHON_FILE, [], onData, onError, onExit)
	},
}