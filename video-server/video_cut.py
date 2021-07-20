from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.video.compositing.concatenate import concatenate_videoclips
from os import path
import sys, getopt
import random
import json
import os



def printAndFlush(data):
	print(data)
	sys.stdout.flush()

def printError(data):
	print(data)
	sys.stderr.flush()


def getArgs(argv):	# file compilation_path start_time duration
	return argv[1], argv[2], int(argv[3]), int(argv[4])

#read args 
file, compilation, start_time, duration = getArgs(sys.argv)
printAndFlush('Starting Video Cut for :'+compilation)
compilation = compilation +'.mp4'
randomFileNumber = "ip_"+str(random.randint(1,100000));
printAndFlush('Compilation :'+compilation +'| Video #:'+randomFileNumber)

#copy already created compilation video & build on top
if path.exists(compilation):
	printAndFlush('Reading from existing compilation file')
	current_compilation_video = VideoFileClip(compilation)
	clip_input = VideoFileClip(file).subclip(start_time,start_time + duration)
	printAndFlush('Concatenating compilation video with new clip')
	video = concatenate_videoclips([current_compilation_video,clip_input])
#in beginning, no file will be present
else:
	printAndFlush('Getting single clip')
	video = VideoFileClip(file).subclip(start_time,start_time + duration)

printAndFlush('Writing video file')	
video.write_videofile(randomFileNumber+'.mp4',temp_audiofile=randomFileNumber+"-audio.m4a", remove_temp=True, codec="libx264", audio_codec="aac", logger=None)
if path.exists(compilation):
	printAndFlush('Removing old compilation file')
	os.remove(compilation)
printAndFlush('Renaming file to compilation name')
os.rename(str(randomFileNumber)+'.mp4', compilation)
#sys.exit('done')
printAndFlush('DONE Stiching')
