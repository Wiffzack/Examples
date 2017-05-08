from __future__ import print_function
import face_recognition
import cv2
import time
import win32gui
import win32con
import win32api
import sys,os
from pycaw.pycaw import AudioUtilities, ISimpleAudioVolume

# Actually, only an extended version of an already existing example. !!!!!!!!!!!!!!!
# https://github.com/ageitgey/face_recognition/tree/master/examples


# This is a demo of running face recognition on live video from your webcam. It's a little more complicated than the
# other example, but it includes some basic performance tweaks to make things run a lot faster:
#   1. Process each video frame at 1/4 resolution (though still display it at full resolution)
#   2. Only detect faces in every other frame of video.

# PLEASE NOTE: This example requires OpenCV (the `cv2` library) to be installed only to read from your webcam.
# OpenCV is *not* required to use the face_recognition library. It's only required if you want to run this
# specific demo. If you have trouble installing it, try any of the other demos that don't require it instead.

# Get a reference to webcam #0 (the default one)
video_capture = cv2.VideoCapture(0)

# Load a sample picture and learn how to recognize it.
your_image = face_recognition.load_image_file("C:/Users/Gregor/Desktop/python/foto1.jpg")
obama_face_encoding = face_recognition.face_encodings(your_image)[0]

# Initialize some variables
face_locations = []
face_encodings = []
face_names = []
process_this_frame = True
#name = "Unknown"
delay = 0;delay2 = 0

def audiocontrol(input):
	sessions = AudioUtilities.GetAllSessions()
	for session in sessions:
		volume = session._ctl.QueryInterface(ISimpleAudioVolume)
		if input:
			volume.SetMute(1, None)
		else:
			volume.SetMute(0, None)

def check(name):
	if (name == "Unknown" or name == "Nothing"):
		delay2+=1
		if delay2 == 20:
			win32gui.SendMessage(win32con.HWND_BROADCAST, win32con.WM_SYSCOMMAND,win32con.SC_MONITORPOWER, 2)
			audiocontrol(1)
			delay=0
	if name == "YourName":
		win32gui.SendMessage(win32con.HWND_BROADCAST, win32con.WM_SYSCOMMAND,win32con.SC_MONITORPOWER, -1)
		audiocontrol(0)

try:
	while True:
		global switch
		# Grab a single frame of video
		ret, frame = video_capture.read()
		if not face_locations:
			delay+=1
			if delay == 10:
				win32gui.SendMessage(win32con.HWND_BROADCAST, win32con.WM_SYSCOMMAND,win32con.SC_MONITORPOWER, 2)
				delay = 0;
				audiocontrol(1)
				
				
		# Resize frame of video to 1/4 size for faster face recognition processing
		small_frame = cv2.resize(frame, (0, 0), fx=0.25, fy=0.25)

		# Only process every other frame of video to save time
		if process_this_frame:
			# Find all the faces and face encodings in the current frame of video
			face_locations = face_recognition.face_locations(small_frame)
			face_encodings = face_recognition.face_encodings(small_frame, face_locations)

			face_names = []
			if not face_encodings:
				name = "Nothing"
			for face_encoding in face_encodings:
				# See if the face is a match for the known face(s)
				match = face_recognition.compare_faces([obama_face_encoding], face_encoding)
				name = "Unknown"

				if match[0]:
					name = "YourName"
				check(name)
				face_names.append(name)
		process_this_frame = not process_this_frame


		# Display the results
		for (top, right, bottom, left), name in zip(face_locations, face_names):
			# Scale back up face locations since the frame we detected in was scaled to 1/4 size
			top *= 4
			right *= 4
			bottom *= 4
			left *= 4

			# Draw a box around the face
			cv2.rectangle(frame, (left, top), (right, bottom), (0, 0, 255), 2)

			# Draw a label with a name below the face
			cv2.rectangle(frame, (left, bottom - 35), (right, bottom), (0, 0, 255), cv2.FILLED)
			font = cv2.FONT_HERSHEY_DUPLEX
			cv2.putText(frame, name, (left + 6, bottom - 6), font, 1.0, (255, 255, 255), 1)


		# Display the resulting image
		cv2.imshow('Video', frame)

		# Hit 'q' on the keyboard to quit!
		if cv2.waitKey(1) & 0xFF == ord('q'):
			break

	# Release handle to the webcam
	video_capture.release()
	cv2.destroyAllWindows()
except KeyboardInterrupt:
	try:
		try:
			video_capture.release()
			cv2.destroyAllWindows()
			sys.exit(0)
		except OSError:
			pass
	except SystemExit:
		os._exit(0)
