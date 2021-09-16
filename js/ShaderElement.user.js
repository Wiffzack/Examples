// ==UserScript==
// @name     Shader
// @include  http://YOUR_SERVER.COM/YOUR_PATH/*
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require  http://ricku34.github.io/ShaderElement/build/ShaderElement.min.js
// @grant    GM_addStyle
// @include        http://*
// @include        https://*
// @grant               none
// @license             MIT License
// @run-at              document-idle
// ==/UserScript==

//  movie-player

  $("body").append ( `
<script type="x-shader/x-fragment" id="SepiaShaderCode">
uniform vec2 resolution;
uniform float intensity;
uniform sampler2D image;

const mat4 YIQMatrix = mat4(   
	0.299,  0.596,  0.212, 0.000,
	0.587, -0.275, -0.523, 0.000,
	0.114, -0.321,  0.311, 0.000,
	0.000,  0.000,  0.000, 1.000
);	

const mat4 inverseYIQ = mat4(
	1.0,    1.0,    1.0,    0.0,
	0.956, -0.272, -1.10,  0.0,
	0.621, -0.647,  1.70,   0.0,
	0.0,    0.0,    0.0,    1.0
);

void main(void) 
{
	vec4 rgbaColor = texture2D(image, gl_FragCoord.xy/resolution);
	vec4 yiqaColor = YIQMatrix * rgbaColor;
	yiqaColor.y = intensity; 
    yiqaColor.z = 0.0;
	gl_FragColor =  inverseYIQ * yiqaColor;
	
} 
</script>
` );

$("body").append ( `
	<br/>
<shader src="SepiaShaderCode"
		style="width: 472px; height: 266px; left: 0px; top: 0px; z-index: -1; position: fixed;"
		image = "{ sample : 'video'}"  intensity="0.2" crossorigin="anonymous" id="SepiaShader" >
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





async function getVideoTag() {
    while(document.getElementsByTagName("video").length <= 0 || document.getElementById("Video").length <= 0) {
        await new Promise(r => setTimeout(r, 500));
    }
    while(globalMovOrig === undefined){
    try{
       globalMovOrig=document.getElementsByTagName("video")[0]
    }
    catch (e) {
        try{
             globalMovOrig=document.getElementById("Video")[0];
        }
        catch(e){
             var player = document.getElementById('movie-player');
             globalMovOrig = player.getElementsByTagName('iframe')[0];
        }
    
    }
    }
  
    return globalMovOrig
}

async function injectCanvas() {
    console.log('Injecting canvas...')

    globalMovOrig = await getVideoTag()
    let div = globalMovOrig.parentElement
    div = globalMovOrig.parentElement
    div.style.backgroundColor = "black" // Patch for ACFun.

    globalBoard = document.createElement('canvas');
    globalBoard.style.width = '100%';
    globalBoard.style.height = '100%';
    globalBoard.width = globalBoard.offsetWidth;
    globalBoard.height = globalBoard.offsetHeight;
    // Add it back to the div where contains the video tag we use as input.
    console.log("Adding new canvas.")
  
    //<shader src="SepiaShaderCode"
	  //	style="margin: 2px;border: none; width: 480px; height: 204px"
		//image = "{ sample : 'video'}"  intensity="0.2" crossorigin="anonymous" id="SepiaShader" >
    globalBoard.src="SepiaShaderCode";
    globalBoard.setAttribute("image",  "{ sample : 'video'}");
    globalBoard.setAttribute("intensity",  0.2);
    globalBoard.setAttribute("crossorigin",  "anonymous");
    globalBoard.id="SepiaShader";
    div.appendChild(globalBoard)
    // Hide original video tag, we don't need it to be displayed.
    globalMovOrig.style.display = 'none'
}


function addstring(src,video){
      image = "{ href : [ '"+  src +"' ] }"
      //document.getElementById("SepiaShader").src = src;
      //document.getElementById("SepiaShader").setAttribute = ("image",image);
      // "{ href : [ './assets/sintel.mp4', './assets/sintel.ogv' ] }"
      str = "{ href : [ '"+  src +"' ] }"
      document.getElementById("SepiaShader").setAttribute("image", image);
      //$('#countryscript').attr("data-main", countrycod);

      //video.getAttribute('image');
      globalMovOrig = video;
      globalMovOrig.id="video";
  
}

async function start(){
try{
      var video = getVideoTag();
      var src = video.src;
      if (src === undefined){ src = document.getElementsByTagName("video")[0].src; }
      //var image = video.getAttribute('image');
       console.log(src)
      addstring(src,video);
}
catch (e) {
          console.log(e)
      try{
                var video = getVideoTag();
                var src = document.getElementById("Video").src;
                console.log(src)
                //var image = document.getElementById("Video").getAttribute('image');
                addstring(src,video);
      }
      catch(e){
                  console.log(e)
        
                var video = getVideoTag();
                try{
                  var src = document.getElementById('movie-player').getElementsByTagName('iframe')[0].src;
                }
                catch(e){
                  var src = document.getElementById('movie-player').src;
                }
                console.log(src)
                //var image = document.getElementById("SepiaShader").getAttribute('image'); 
                addstring(src,video);

        
      }
}
}


document.addEventListener("DOMContentLoaded", function(event){
  start();
});


setTimeout(function(){
  //injectCanvas();
//start();
}, 3000);
















