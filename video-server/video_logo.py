from moviepy.editor import *
from moviepy.video.io.VideoFileClip import VideoFileClip
from moviepy.video.compositing.CompositeVideoClip import CompositeVideoClip 
from moviepy.video.VideoClip import ImageClip
from os import path
import sys, getopt
import random
import json



def printAndFlush(data):
	print(data)
	sys.stdout.flush()

def printError(data):
	print(data)
	sys.stderr.flush()


def getArgs(argv):	#compilation_path logo_path
	return argv[1], argv[2]

#read args 
compilation_path ,logo_path = getArgs(sys.argv)
printAndFlush('Starting adding Logo to Video ')
randomFileNumber = "ip_"+str(random.randint(1,100000));
printAndFlush('Compilation :'+compilation_path +'| Video #:'+randomFileNumber)

video = VideoFileClip(compilation_path)

logo = (ImageClip(logo_path)
          .set_duration(video.duration)
          .resize(height=60) # if you need to resize...
          .margin(right=10, top=10, opacity=0) # (optional) logo-border padding
          .set_pos(("right","top")))

final = CompositeVideoClip([video, logo])
final.write_videofile(randomFileNumber+'.mp4',temp_audiofile=randomFileNumber+"-audio.m4a", remove_temp=True, codec="libx264", audio_codec="aac", logger=None)
printAndFlush('Finish compilation logo composite')
os.remove(compilation_path)
printAndFlush('removing old file compilation_path')
os.rename(str(randomFileNumber)+'.mp4', compilation_path)
printAndFlush('Renaming file to compilation name')
