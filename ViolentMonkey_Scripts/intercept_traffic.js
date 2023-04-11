// ==UserScript==
// @name        XMLHttpRequest Override
// @namespace   Violentmonkey Scripts
// @match       https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
// @grant       none
// @include        http://*
// @include        https://*
// @exclude https://www.youtube.com*
// @version     1.0
// @author      -
// @description 9.4.2023, 16:36:15
// ==/UserScript==

var oldopen = unsafeWindow.XMLHttpRequest.prototype.open;
var oldSend = unsafeWindow.XMLHttpRequest.prototype.send;
var oldSet = unsafeWindow.XMLHttpRequest.prototype.setRequestHeader;
page = window.location.href.split("/")[2].split(".")[1]


WebSocket.prototype.oldSend = WebSocket.prototype.send;

WebSocket.prototype.send = function(data) {
     console.log("ws: sending data "+data);
     WebSocket.prototype.oldSend.apply(this, [data]);
};

XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    console.log("Fetched Url:  "+url)
      xhrOpenRequestUrl = url;     // update request url, closure variable
      oldopen.apply(this, arguments); // reset/reapply original open method
};

window.fetch = new Proxy(window.fetch, {
      apply: function (target, that, args) {
        console.log(args)
        // args holds argument of fetch function
        // Do whatever you want with fetch request
        let temp = target.apply(that, args);
        return temp;
      },
    });

