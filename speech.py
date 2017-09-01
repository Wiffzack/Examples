#!/usr/bin/env python3
# Requires PyAudio and PySpeech.
 
from __future__ import print_function,unicode_literals
import unittest
from nose.tools import *  # PEP8 asserts
from nose.plugins.attrib import attr

#from textblob.sentiments import PatternAnalyzer, NaiveBayesAnalyzer, DISCRETE, CONTINUOUS
#from textblob import TextBlob
import speech_recognition as sr
from time import ctime
import time
import os
from gtts import gTTS
import wikipedia
from google import google
import win32gui
import win32con
import win32api
#from ctypes import cast, POINTER
#from comtypes import CLSCTX_ALL
#from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
from playsound import playsound
import win32com.client as wincl

data = '';lastwords = ''

 
teamspeakc = r'"C:\\Program Files\\TeamSpeak 3 Client\\ts3client_win64.exe"'
 
def speak(audioString):
	try:
		speak = wincl.Dispatch("SAPI.SpVoice")
		speak.Speak(audioString)
	except:
		tts = gTTS(text=audioString, lang='en')
		tts.save("audio.mp3")
		try:
			playsound('audio.mp3')
		except:
			os.system("mpg123 audio.mp3")
 
def recordAudio():
	# Record Audio
	r = sr.Recognizer()
	with sr.Microphone() as source:
		r.adjust_for_ambient_noise(source)  # listen for 1 second to calibrate the energy threshold for ambient noise levels
		print("Say something!")
		audio = r.listen(source)
 
	# Speech recognition using Google Speech Recognition
	data = ""
	try:
		# Uses the default API key
		# To use another API key: `r.recognize_google(audio, key="GOOGLE_SPEECH_RECOGNITION_API_KEY")`
		data = r.recognize_google(audio)
		print("You said: " + data)
	except sr.UnknownValueError:
		print("Google Speech Recognition could not understand audio")
	except sr.RequestError as e:
		print("Could not request results from Google Speech Recognition service; {0}".format(e))
	except KeyError:                                    # the API key didn't work
		print("Invalid API key or quota maxed out")
	except LookupError:                                 # speech is unintelligible
		print("Could not understand audio")
 
	return data
	
def jarvis(data):
	if "jarvis" in data:
		speak("Whats up")
		
	if "open TeamSpeak" in data:
		os.system(teamspeakc)
		
	if "search Wikipedia" in data:
		cache = data.split()
		cache = cache[-1]
		#analyse = TextBlob(wikipedia.summary(cache))
		#analyse.sentiment
		#objectivity = ("%.2f" % round(analyse.sentiment.subjectivity,2))
		#string = (str(objectivity))
		#speak(string)
		speak(wikipedia.summary(cache))
		
		lastwords = cache
		
	if "volume up" in data:
		devices = AudioUtilities.GetSpeakers()
		interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
		volume = cast(interface, POINTER(IAudioEndpointVolume))
		volume.SetMasterVolumeLevel(-20.0, None)
		
	if "volume down" in data:
		devices = AudioUtilities.GetSpeakers()
		interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
		volume = cast(interface, POINTER(IAudioEndpointVolume))
		volume.SetMasterVolumeLevel(-5.0, None)

	if "search Google" in data:
		cache = data.split()
		cache = cache[-1]
		print (cache)
		os.startfile("https://www.google.com/search?safe=active&q=" + cache)
		
	if "search Google Images" in data:
		cache = data.split()
		cache = cache[-1]
		os.startfile("https://www.google.nl/maps/place/" + location + "/&amp;")
 
	if "what time is it" in data:
		speak(ctime())
 
	if "where is" in data:
		data = data.split(" ")
		location = data[2]
		speak("Hold on Frank, I will show you where " + location + " is.")
		os.startfile("https://www.google.nl/maps/place/" + location + "/&amp;")
 
# initialization

time.sleep(2)
#speak("Hi Frank, what can I do for you?")
while 1:
	#speak("easy test")
	data = recordAudio()
	jarvis(data)
