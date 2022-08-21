import requests
import json
import shutil
import os,sys
import json

cookies = { "PHPSESSID" : "",  "session" : "" }

if(not (cookies['PHPSESSID'] != "" or cookies['session'] != "")):
    print ("You need to insert SessionID and session key")
    exit()

file = sys.argv[1]
title = sys.argv[2]

proxyip = "192.168.251.1"

http_proxy  = "http://"+proxyip+":8080"
https_proxy = "https://"+proxyip+":8080"

proxies = { 
              "http"  : http_proxy, 
              "https" : https_proxy, 
            }

#request = requests.post(site,headers=headers, files=up,cookies=cookies,proxies=proxies)


headers2 = {
    "User-Agent" : "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
    "Accept" : "*/*",
    "Accept-Language" : "de,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding" : "gzip, deflate",
    "Referer" : "http://9gag.com/submit",
    "Origin" : "http://9gag.com",
    "Sec-Fetch-Dest" : "empty",
    "Sec-Fetch-Mode" : "cors",
    "Sec-Fetch-Site" : "same-origin",
    'field1': 'value1',
    "Te" : "trailers2"
}

headers = {
    "User-Agent" : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv" : "103.0) Gecko/20100101 Firefox/103.0',
    "Accept" : "*/*",
    "Accept-Language" : "de,en-US;q=0.7,en;q=0.3",
    "Accept-Encoding" : "gzip, deflate",
    "Referer" : "http://9gag.com/submit",
    "Origin" : "http://9gag.com",
    "Sec-Fetch-Dest" : "empty",
    "Sec-Fetch-Mode" : "cors",
    "Sec-Fetch-Site" : "same-origin",
    "Te" : "trailers"
 }
     
    
############# upload first

site = 'http://9gag.com/submit/upload-image' # the site where you upload the file
submit = 'http://9gag.com/submit'
filename = 'test.webp'  # name example
up = {'file':(filename, open(file, 'rb'), "multipart/form-data")}


## ,proxies=proxies
request = requests.post(site,headers=headers, files=up,cookies=cookies)
## important status 200 doenst say anything !!!
print(request.status_code)


## from our lord and savoir stackoverflow
my_json = request.content.decode('utf8').replace("'", '"')
#print(my_json)
data = json.loads(my_json)
print(data["uploadId"])

check = {
    "section":[],
    "title":title,
    "tags":"",
    "skipFromLists":1,
    "nsfw":0,
    "isAnonymous":0,
    "source":"",
    "uploadId": data["uploadId"],
    "type":"photo"
}


requests.post(submit, headers=headers2,json=check,cookies=cookies)
print(request.status_code)
print (request.content)
