from __future__ import unicode_literals
from os import path
import sys, getopt
import random
import youtube_dl
from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.video.compositing.concatenate import concatenate_videoclips
from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip 
from moviepy.video.VideoClip import ImageClip


# Tests to ensure python can run on server

# On start of the server, this file will run in child process

def printAndFlush(data):
	print(data)
	sys.stdout.flush()

def printError(data):
	print(data)
	sys.stderr.flush()

printAndFlush('test data printing')