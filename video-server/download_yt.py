from __future__ import unicode_literals
import youtube_dl
import sys

def getArgs(argv):	# youtube url, dir, episode id
	return argv[1], argv[2], argv[3]

video_url, directory, episode_id = getArgs(sys.argv)

ydl_opts = {
'format': 'best',
	'outtmpl': directory + str(episode_id) + '.mp4',
	'no_warnings': True
}
with youtube_dl.YoutubeDL(ydl_opts) as ydl:
    ydl.download([video_url])