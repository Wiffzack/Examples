from __future__ import print_function
import os,sys
try:
	sys.path.insert(0, '/usr/local/lib/python2.7/dist-packages')
	sys.path.insert(0, os.path.expanduser('~/lib'))
except:
	pass
from datetime import date, datetime, timedelta
import mysql.connector
#import gevent
from flask import Flask,request,copy_current_request_context
from flask_compress import Compress
from flask_socketio import SocketIO, send,emit, join_room, leave_room
import string
from rake_nltk import Rake
import json
import threading
import time
import numpy
from multiprocessing import Process, Manager, freeze_support
import multiprocessing as mp
import pathos.pools as pp

#from gevent import monkey
#monkey.patch_all()

# This code need to be optimised ! becouse its really bad written!


app = Flask(__name__)
compress = Compress()
compress.init_app(app)
app.config['SECRET_KEY'] = 'mysecret'
socketio = SocketIO(app,async_mode='gevent')
chars = set('+*/=')
nmsg = r''
link = """<a target="_blank" href="link1">text1</a>"""
image = """<img src="link2" alt="text2" style="width:128px;height:128px;">"""
equat= """<script>var res = (math.simplify('test3').toString());$('#messages').append('<li>' + res + '</li>');</script>"""
cookies = """<script>createCookie("func","text3");function createCookie(a,b){document.cookie=a+"="+b};</script> """
plot = """<a href="#" onClick="MyWindow=window.open('plotsom.html','MyWindow',width=600,height=300);return false">text4</a> """
#equat= """<script>var res = (math.simplify('test3').toString());document.getElementById("messages").innerHTML = res;</script>"""
linkn = """"""
keyw = ['']
test = ''
r = Rake()
sqlcn = """"""
query = ("""SELECT rating,keyword,address FROM pdf LIMIT 0 , 3""")
rows = []
# msgl should be a numyp array
msgl = [''];msgn = [''];
# Windows :1 Linux :0
osf = 0 
#nothing :2 multiprocessing :1 multithreading :0
multip = 2
#msgl = numpy.array([''])
Mylist = [''];blockl = [''];index = [];fpart = [''];blocklw = ['']
threads = []
workn = 1
data = ''

mysqln = 'yourdomain.com'

try:
	try:
		cnx = mysql.connector.connect(user='User', password='Password', database='Database')
		cursor = cnx.cursor()
	except:
		cnx = mysql.connector.connect(host=mysqln, user='User', password='Password', database='Database')
		cursor = cnx.cursor()
except:
	print ("MySQL not available!")
	
@socketio.on('message')
def handleMessage(msg):
	global msgl,data
	@copy_current_request_context
	def createmp():
		try:
			try:
				threading1 = threading.Thread(target=worker)
				threading1.daemon = True
				threading1.start()
			except UnboundLocalError:
				return
		except IOError:
			pass
			
	#CREATE TABLE pdf (ranking int,rating int,calls int ,keyword varchar(255),mkeyword varchar(255),type int);
	#SELECT MAX(rating),keyword,address FROM pdf where keyword like 'Gradient';
	def readdbentry(keyword):
		global rows,test,keyw
		sqln2 = '''SELECT MAX(rating),keyword,address FROM pdf WHERE INSTR(keyword, "string1") LIMIT 1; '''
		sqlcn = string.replace(sqln2,"string1", keyword);
		try:
			cursor.execute(sqlcn)
			rows = cursor.fetchall()
			cache = str(rows[0][2])
			if  (cache == "None"):
				return
			linkn = string.replace(link,"link1", cache)
			linkn = string.replace(linkn,"text1", keyword)
			#print (linkn)
			return linkn
		except:
			#print ("nothing found")
			return

	def gendbentry(rating,keyword,addresse):
		global sqlc
		sqlc = """INSERT INTO pdf(rating,keyword,address)VALUES (string1, 'string2', 'string3')""";
		sqlcn = string.replace(sqlc,"string1", rating);
		sqlcn = string.replace(sqlcn,"string2", keyword);
		sqlcn = string.replace(sqlcn,"string3", addresse);
		add_employee = (sqlcn)
		cursor.execute(add_employee)
		emp_no = cursor.lastrowid
		cnx.commit()			
			
		
	def worker():
		"""thread worker function"""
		global msgl,workn,blockl
		while True:
			while workn:
				time.sleep(1)
				for x in msgl:
					if x not in blockl:
						t = threading.Thread(target=mainfunc,args=(x,))
						threads.append(t)
						t.start()
						try:
							msgl.remove(x)
						except ValueError:
							try:
								pass
							except:
								pass
						blockl.append(x)

	def strladd(lower,upper,finish):
		global test,fpart
		cache = test[lower:upper]
		fpart.append(cache)
		if (finish):
			msg = ''.join(msgn)				
				
	def strchk(index):
		comp = 0;
		while True:
			try:
				if msg[index+comp] == ' ':
					index = int(index+comp)
					return index
				else:
					comp=comp+1
			except IndexError:
				pass
		return index
			
	# cut the string in 4 parts
	def stranasplit(msg):
		index.append(strchk(len(msg)/4))
		index.append(strchk(index[0]*2))
		index.append(strchk(index[0]*3))
		index.append(len(msg))

		strladd(0,index[0],0)
		strladd(index[0],index[1],0)
		strladd(index[1],index[2],0)
		strladd(index[2],index[3],0)

# On Android ls -ld /dev/shm isnt available 
# Multiprocessing and Multithreading isnt available
	@copy_current_request_context
	def textanafunc(msg):
		from multiprocessing import Process, Manager, freeze_support
		import pymp
		global fpart,test
		if multip == 2:
			print (msg)
			cache = textaworkmp(msg)
			print (cache)
			listo = ''.join(cache)	
		else:
			procs = []
			jobs = []	
			try:
				i = 0
				stranasplit(msg)
				if multip == 0:
					pymp.config.thread_limit = 1
					pymp.config.nested = True
					tlist = pymp.shared.list()
					listo = pymp.shared.list()
					tlist = fpart
					with pymp.Parallel(4) as p:
						for x in tlist:
							cache = (textaworkmp(x))
							listo.append(cache)
					listo = ''.join(listo)	
				if multip == 1:
					manager = Manager()
					return_dict = manager.list()
					for x in fpart:
						p = Process(target=textawork, args=(x,return_dict,i))
						jobs.append(p)
						p.start()
						i = i + 1
					for proc in jobs:
						proc.join()
					listo = ''.join(return_dict)
			except OSError:
			# One work after another
				for x in fpart:
					cache = (textaworkmp(x))
					listo.append(cache)
				listo = ''.join(listo)	
			
		send(str(listo), room=1)
		test = '';fpart = ['']
			
	def textaworkmp(msg):
		from textblob import TextBlob
		global test
		test = TextBlob(str(msg))
		try:
			testk = str(keywords(test))
			return (testk)
		except:
			pass    #test = str(test.correct())
			
	# This need to be done befor text is split! Context!
	#
	##print (test.sentiment.subjectivity)
	#if ( test.sentiment.subjectivity >= 0.3 and test.sentiment.subjectivity != 0.0):	
	#@copy_current_request_context
	def textawork(msg, return_dict,i):
		from textblob import TextBlob
		global test
		test = TextBlob(str(msg))
		try:
			testk = str(keywords(test))
			print (testk)
			print ("hier")
			return_dict.insert(i, testk)
		except:
			pass    #test = str(test.correct())
			
			
	@copy_current_request_context
	def mainfunc(msg = [], *args):
		from sympy import solve, Poly, Eq, Function, exp
		from sympy.abc import x
		from sympy import sympify
		from sympy import Symbol
		from textblob import TextBlob
		global test,request
		if not msg:
			return
		else:
			pass
		try:
			omsg = msg
			if any((c in chars) for c in msg):
				if "y" in msg: 
					equalt = msg.split("=")  #[-1]
					link1 = string.replace(cookies,"text3", equalt[1])
					link2 = string.replace(plot,"text4", msg)
					linkn = link1 + link2
					send(linkn, room=1)
				else:
					if "x" in msg: 
						equalt = msg.split("=")  #[-1]
						nmsg = solve(Eq(sympify(equalt[0]), sympify(equalt[-1])), x)   #nmsg = solve(msg) #lt = len(nmsg) solve(Eq(x**2 - 1, 2), x)
						nmsg=str(nmsg)
						send(nmsg, room=1)
					else:
						solution = string.replace(equat,"test3", msg);
						send(str(solution), room=1)
			else:
				try:
					test = TextBlob(str(msg))
					#if ( test.sentiment.subjectivity >= 0.3 and test.sentiment.subjectivity != 0.0):
					textanafunc(msg)
					msg = ['']
					#else:
					#send("Try more objective discussion", room=1)
				except IOError:
					pass
					send(msg, room=1)
		except KeyboardInterrupt:
			try:
				try:
					os.system("taskkill /f /im python.exe")
					sys.exit(0)
				except OSError:
					pass
			except SystemExit:
				os._exit(0)
				
	data = request.get_json() 
	#Protect from spam
	if msg not in msgl:
		msgl.append(msg)
	try:
		print (msgl)
		print ("now msg :----------<<<<")
		print (msg)
		createmp()
	except NameError:
		pass
			
	def keywords(msgi):
		import wikipedia
		global keyw,test,r
		if msgi:
			test = msgi
		print (test)
		try:
			r.extract_keywords_from_text(str(test))
			keyw = r.get_ranked_phrases()
			if (len(keyw) > 5):
				keyw = keyw[:5]
			else:
				pass
		except:
			keyw = test.noun_phrases
		try:
			if keyw:
				for x in keyw:
					scache = x.split(" ")
					for y in scache:
						try:
							linkn = readdbentry(y)
							if (linkn):
								ix = keyw.index(y)
								test = str(string.replace(test,keyw[ix],linkn))
							else:	
								raise ValueError('A very specific bad thing happened.')
						except:
							try:
								ix = keyw.index(x)
								ny = wikipedia.page(keyw[ix])
								ny = ny.url
								if not ny in blocklw:
									blocklw.append(ny)
									linkn = string.replace(link,"link1", ny)
									linkn = string.replace(linkn,"text1", keyw[ix])
									test = str(string.replace(test,keyw[ix],linkn))
							except:
								pass
				return (test)
				test = '';keyw = ['']
			else:
				return (test)
		except:
			return (test)
						
@socketio.on('event')			
def handleMessage(msg):
	test = str(msg)
	new = test.split(": u'")[1]
	new = new[:-2]
	send(new, room=2)
	##send(new,  broadcast = True)

@socketio.on('joined')
def joined(message):
	"""Sent by clients when they enter a room.
	A status message is broadcast to all people in the room."""
	#print("room 1 joined")
	join_room(1)
	##send(msg, room=1)
	
@socketio.on('leave')
def joined(message):
	"""Sent by clients when they enter a room.
	A status message is broadcast to all people in the room."""
	#print(" room 2 is 2")
	join_room(2)
	##send(msg, room=2)
	
def notusedfunc():
	#gendbentry('1','key1','addresse1')
	#readdbentry()
	cursor.close()
	cnx.close()

# if cpu[0] is higher than 90% 
# use multiprocessing instead of multithreading	
def checkcpu():
	global osf,multip
	while True: 
		time.sleep(2)
		if osf == 0:
			cpu = get_cpu_load_l()
		if osf == 1:
			cpu = get_cpu_load_w()
		if cpu >= 90:
			multip = 1
		
		
def get_cpu_load_w():
	""" Returns a list CPU Loads"""
	result = []
	cmd = "WMIC CPU GET LoadPercentage "
	response = os.popen(cmd + ' 2>&1','r').read().strip().split("\r\n")
	for load in response[1:]:
		result.append(int(load))
	return result	
	
def get_cpu_load_l():
	import psutil
	return psutil.cpu_percent()

def mtr():
	bashCommand = "ls -ld /dev/shm"
	import subprocess
	try:
		process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)
		output, error = process.communicate()
		if not error:
			multip = 2
	except:
		multip = 2
	
def initials():
	import platform
	global osf
	bet = platform.system()
	if bet == 'Windows':
		osf = 1
		freeze_support()
	if bet == 'Linux':
		mtr()
		osf = 0
		
if __name__ == '__main__':
	initials()
	try:
		socketio.run(app, host='0.0.0.0',port=5001)
	except KeyboardInterrupt:
		try:
			try:
				#socket.disconnect(0);
				os.system("taskkill /f /im python.exe")
				sys.exit(0)
			except OSError:
				pass
		except SystemExit:
			os._exit(0)
			
