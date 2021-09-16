// ==UserScript==
// @name     Shader
// @include  http://YOUR_SERVER.COM/YOUR_PATH/*
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require  http://ricku34.github.io/ShaderElement/build/ShaderElement.min.js
// @grant    GM_addStyle
// @include        http://*
// @include        https://*
// ==/UserScript==
//--- The @grant directive is used to restore the proper sandbox.


$("body").append ( `
	<br/>
<shader src="https://ricku34.github.io/ShaderElement/samples/Sepia.glsl"
		style="margin: 2px;border: none; width: 480px; height: 204px"
		image = "{ sample : 'video'}"  intensity="0.2" id="SepiaShader" >
</shader>
	<br/>
	<em>Sepia Shader Video<em>
	<br/>
	<br/>
` );

function UpdateVideo(evt)
{
  var shader = evt.detail;
  shader.addEventListener('frame',function()
  {
    shader.uniforms.image.value = { sample :  video} ;
  },false)
}


setTimeout(function(){
    try{
       var video = document.getElementsByTagName("video")[0];
           globalMovOrig = video;
     globalMovOrig.id="video";
    }
    catch (e) {
      var video =  document.getElementById("Video");
           globalMovOrig = video;
           globalMovOrig.id="video";
    }


}, 5000);




















