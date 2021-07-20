const reducer = (accumulator, currentValue) => accumulator + currentValue;

var ctx;
var startTime;
var rectangle;
var textBoxes;
var drawBoxes;


var fontSize = 20;
var margin = 30
var breakMargin = 20
var squareWidth = 10;

var iconSize = {
	width: 30,
	height: 25
};
var usernameMargin = 30;

let SCREEN_WIDTH = 1000;
let SCREEN_HEIGHT = 400;

let TWEET_WIDTH = 800;
let TWEET_HEIGHT;

let STYLE_OPTIONS = {
	dark: {
		font_color: "#fff",
		background_color: "transparent",
		border_color: "#fff",
	},
	light: {
		font_color: "#000",
		background_color: "#fff",
		border_color: "#000"
	}
}

var ANIMATION_TIMES = {
	boxUp: 200,
	increaseWidth: 500,
	inceaseHeight: 300,
	fadeInText: 200,
	wait: 2000
}

let STYLE = STYLE_OPTIONS.light;


/*window.onload = function(){

	SCREEN_WIDTH = screen.width - 50;
	SCREEN_HEIGHT = screen.height - 100;
	var canvas = document.getElementById('canvas');
	//canvas.style.width = SCREEN_WIDTH+"px"
	//canvas.style.height = SCREEN_HEIGHT+"px"
}*/

function sampleText() {
	document.getElementById('username').value = "bballbreakdown"
	document.getElementById('text').value = "Can D Angelo Russell fit with Steph Curry and the Warriors?\nCredit:@bballbreakdown"
	doAnimation(function() {
		console.log('done')
	})
}

function resetAnimationVariables() {
	rectangle = {
		x: 0,
		y: 0,
		width: 10,
		height: 0,
		completedAnimationDuration: [],
		render: function(ctx) {
			ctx.save();
			ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)
			ctx.fillStyle = STYLE.background_color;
			ctx.strokeStyle = STYLE.border_color;
			ctx.lineWidth = 3;
			roundRect(ctx, this.x, this.y, this.width, this.height);
			ctx.restore(ctx);
		}
	}

	var canvas = document.getElementById('canvas');
	ctx = canvas.getContext('2d')

	startTime = Date.now()

	textBoxes = {}
	drawBoxes = {}
}


function createTextBox() {
	return {
		x: 0,
		y: 0,
		maxWidth: 0,
		lineHeight: 0,
		alpha: 0,
		text: '',
		render: function() {
			ctx.save();
			ctx.font = fontSize + "px Arial";
			ctx.globalAlpha = this.alpha
			ctx.fillStyle = STYLE.font_color;
			wrapText(ctx, this.text, this.x, this.y, this.maxWidth, this.lineHeight)
			ctx.restore(ctx);
		}
	}

}

function createImgBox() {
	console.log('create img')
	return {
		x: 0,
		y: 0,
		width: 0,
		height: 0,
		alpha: 0,
		src: '',
		render: function(ctx) {
			ctx.save();
			console.log('img box render:' + this.alpha)
			var image = new Image();
			image.src = this.src
			var t = this;
			ctx.globalAlpha = this.alpha;
			image.onload = function() {
				ctx.drawImage(image, t.x, t.y, t.width, t.height);
			}
			ctx.restore()
		}
	}
}

function setUpTextBoxes(callback) {
	textBoxes.username = createTextBox()
	textBoxes.username.x = rectangle.x + margin + iconSize.width + usernameMargin
	textBoxes.username.y = rectangle.y + margin + iconSize.height / 2
	textBoxes.username.maxWidth = TWEET_WIDTH - (margin * 2)
	textBoxes.username.lineHeight = fontSize

	textBoxes.text = createTextBox()
	textBoxes.text.x = rectangle.x + margin
	textBoxes.text.y = rectangle.y + margin + iconSize.height + breakMargin
	textBoxes.text.maxWidth = TWEET_WIDTH - (margin * 2)
	textBoxes.text.lineHeight = fontSize

	Object.keys(textBoxes).forEach(function(key) {
		textBoxes[key].text = (document.getElementById(key).value ? document.getElementById(key).value : ' ')
	})
	textBoxes.username.text = '@' + textBoxes.username.text;

	drawBoxes.twitterIcon = createImgBox();
	drawBoxes.twitterIcon.x = rectangle.x + margin + usernameMargin / 2
	drawBoxes.twitterIcon.y = textBoxes.username.y - fontSize
	drawBoxes.twitterIcon.width = iconSize.width;
	drawBoxes.twitterIcon.height = iconSize.height;
	drawBoxes.twitterIcon.src = 'https://upload.wikimedia.org/wikipedia/fr/thumb/c/c8/Twitter_Bird.svg/1259px-Twitter_Bird.svg.png';

	callback()

}

function shouldFinishAnimation(duration) {
	return Date.now() - startTime - rectangle.completedAnimationDuration.reduce((a, b) => a + b, 0) > duration

}

function updateTweetHeight(callback) {
	var totalHeight = 0;

	Object.keys(textBoxes).forEach(function(a) {
		totalHeight += getWrapTextHeight(ctx, textBoxes[a].text, textBoxes[a].maxWidth, textBoxes[a].lineHeight)
	})
	TWEET_HEIGHT = totalHeight + (margin * 2) + breakMargin;
	callback()
}



function getWrapTextHeight(ctx, text, maxWidth, lineHeight) {
	ctx.font = fontSize + "px Arial";


	var totalHeight = 0;
	var lines = text.split('\n')
	lines.forEach(function(line) {
		var words = line.split(' ');
		var currentLine = ''
		for (var n = 0; n < words.length; n++) {
			var testLine = currentLine + words[n] + ' ';
			var metrics = ctx.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				totalHeight += lineHeight;
				currentLine = words[n] + ' ';
			} else {
				currentLine = testLine;
			}
		}
		totalHeight += lineHeight;
	});
	return totalHeight;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
	ctx.font = fontSize + "px Arial";

	var lines = text.split('\n')
	lines.forEach(function(line) {
		var currentLine = ''
		var words = line.split(' ');
		for (var n = 0; n < words.length; n++) {
			var testLine = currentLine + words[n] + ' ';
			var metrics = ctx.measureText(testLine);
			var testWidth = metrics.width;
			if (testWidth > maxWidth && n > 0) {
				ctx.fillText(currentLine, x, y);
				y += lineHeight;
				currentLine = words[n] + ' ';
			} else {
				currentLine = testLine
			}
		}
		ctx.fillText(currentLine, x, y);
		y += lineHeight;
	});
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
	if (typeof stroke == "undefined") {
		stroke = true;
	}
	if (typeof radius === "undefined") {
		fill = true;
	}
	if (typeof radius === "undefined") {
		radius = 5;
	}
	ctx.beginPath();
	ctx.moveTo(x + radius, y);
	ctx.lineTo(x + width - radius, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
	ctx.lineTo(x + width, y + height - radius);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	ctx.lineTo(x + radius, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
	ctx.lineTo(x, y + radius);
	ctx.quadraticCurveTo(x, y, x + radius, y);
	ctx.closePath();
	if (stroke) {
		ctx.stroke();
	}
	if (fill) {
		ctx.fill();
	}
}

function getStep(duration, maxValue) {
	return ((Date.now() - startTime - rectangle.completedAnimationDuration.reduce((a, b) => a + b, 0)) / duration) * maxValue
}

function panWidth(duration, fadeIn, callback) {

	if (shouldFinishAnimation(duration)) {
		callback()
		return
	}
	if (fadeIn) {
		rectangle.width = getStep(duration, TWEET_WIDTH);
	} else {
		rectangle.width = TWEET_WIDTH - getStep(duration, TWEET_WIDTH);
	}
	rectangle.render(ctx);
}

function panHeight(duration, fadeIn, callback) {

	if (shouldFinishAnimation(duration)) {
		callback()
		return
	}
	if (fadeIn) {
		rectangle.height = getStep(duration, TWEET_HEIGHT);
	} else {
		rectangle.height = TWEET_HEIGHT - getStep(duration, TWEET_HEIGHT - squareWidth);
	}

	rectangle.render(ctx);
}


function littleBoxUp(duration, fadeIn, callback) {

	if (shouldFinishAnimation(duration)) {
		callback()
		return
	}
	var maxHeight = (SCREEN_HEIGHT) / 2 + TWEET_HEIGHT / 2

	if (fadeIn) {
		rectangle.y = SCREEN_HEIGHT - getStep(duration, maxHeight);
		rectangle.width = getStep(duration, squareWidth);
		rectangle.height = getStep(duration, squareWidth);
	} else {
		rectangle.y = maxHeight + getStep(duration, SCREEN_HEIGHT - maxHeight);
		rectangle.width = squareWidth - getStep(duration, squareWidth);
		rectangle.height = squareWidth - getStep(duration, squareWidth);
	}
	rectangle.render(ctx);
}

function addText(duration, fadeIn, callback) {

	rectangle.render(ctx);

	if (shouldFinishAnimation(duration)) {
		Object.keys(textBoxes).forEach(function(key) {
			textBoxes[key].alpha = (fadeIn ? 1 : 0)
			textBoxes[key].render(ctx)
		})
		Object.keys(drawBoxes).forEach(function(key) {
			drawBoxes[key].alpha = (fadeIn ? 1 : 0)
			if(fadeIn) drawBoxes[key].render(ctx)
		})
		callback()
		return
	}


	Object.keys(textBoxes).forEach(function(key) {
		textBoxes[key].alpha = (fadeIn ? getStep(duration, 1) : 1 - getStep(duration, 1))
		textBoxes[key].render(ctx)
	})
	Object.keys(drawBoxes).forEach(function(key) {
		drawBoxes[key].alpha = (fadeIn ? getStep(duration, 1) : 1 - getStep(duration, 1))
		drawBoxes[key].render(ctx)
	})

}

function doAnimation(callback) {
	resetAnimationVariables();

	STYLE = STYLE_OPTIONS[document.getElementById('styleOption').value]
	ANIMATION_TIMES.wait = parseInt(document.getElementById('duration').value) * 1000

	document.getElementById('canvas').style.background = "#000000"
	fadeInAnimation(function() {
		setTimeout(function() {
			startTime = Date.now()

			fadeOutAnimation(function() {
				callback()
			})
		}, ANIMATION_TIMES.wait)
	});

}

function fadeOutAnimation(callback) {

	var done = false;
	ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	rectangle.completedAnimationDuration = []

	var fadeIn = false;

	setUpTextBoxes(function() {
		updateTweetHeight(function() {
			addText(ANIMATION_TIMES.fadeInText, fadeIn, function() {
				rectangle.completedAnimationDuration.push(ANIMATION_TIMES.fadeInText)
				panHeight(ANIMATION_TIMES.inceaseHeight, fadeIn, function() {
					rectangle.completedAnimationDuration.push(ANIMATION_TIMES.inceaseHeight)
					panWidth(ANIMATION_TIMES.increaseWidth, fadeIn, function() {
						rectangle.completedAnimationDuration.push(ANIMATION_TIMES.increaseWidth)
						done = true;
						return
					})
				})
			});
		})
	})


	if (!done) {
		requestAnimationFrame(function() {
			fadeOutAnimation(callback)
		});
	} else {
		console.log('fade out animation')
		ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
		callback()
	}
}

function fadeInAnimation(callback) {

	rectangle.x = (SCREEN_WIDTH - TWEET_WIDTH) / 2
	rectangle.y = SCREEN_HEIGHT - ((SCREEN_HEIGHT) / 2 + TWEET_HEIGHT / 2)
	rectangle.heigt = 10

	var done = false;
	ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
	rectangle.completedAnimationDuration = []

	var fadeIn = true;


	setUpTextBoxes(function() {
		updateTweetHeight(function() {
			panWidth(ANIMATION_TIMES.increaseWidth, fadeIn, function() {
				rectangle.completedAnimationDuration.push(ANIMATION_TIMES.increaseWidth)
				panHeight(ANIMATION_TIMES.inceaseHeight, fadeIn, function() {
					rectangle.completedAnimationDuration.push(ANIMATION_TIMES.inceaseHeight)
					addText(ANIMATION_TIMES.fadeInText, fadeIn, function() {
						rectangle.completedAnimationDuration.push(ANIMATION_TIMES.fadeInText)
						done = true;
						return
					})
				});
			})

		})
	})


	if (!done) {
		requestAnimationFrame(function() {
			fadeInAnimation(callback)
		});
	} else {
		callback()
	}

}