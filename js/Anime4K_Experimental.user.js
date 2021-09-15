// ==UserScript==
// @name                Upscale Filter 4k
// @name:zh-CN          Bilibili Anime4K滤镜
// @description         Bring Anime4K to Bilibili and ACFun's HTML5 player to clearify 2D anime.
// @description:zh-CN   通过Anime4K滤镜让Bilibili和ACFun上的2D番剧更加清晰
// @namespace           http://net2cn.tk/
// @homepageURL         https://github.com/net2cn/Bilibili_Anime4K/
// @supportURL          https://github.com/net2cn/Bilibili_Anime4K/issues
// @version             0.4.11
// @author              net2cn
// @copyright           bloc97, DextroseRe, NeuroWhAI, and all contributors of Anime4K
// @include        http://*
// @include        https://*
// @grant               none
// @license             MIT License
// @run-at              document-idle
// ==/UserScript==

// WebGL implementation by NeuroWhAI.
// https://github.com/bloc97/Anime4K/blob/master/web/main.js

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);

    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
    }

    return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
    var program = gl.createProgram();

    //console.log(fragmentSource)

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    var wrapper = { program: program };

    var numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (var i = 0; i < numAttributes; i++) {
        var attribute = gl.getActiveAttrib(program, i);
        wrapper[attribute.name] = gl.getAttribLocation(program, attribute.name);
    }
    var numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (var i$1 = 0; i$1 < numUniforms; i$1++) {
        var uniform = gl.getActiveUniform(program, i$1);
        wrapper[uniform.name] = gl.getUniformLocation(program, uniform.name);
    }

    return wrapper;
}

function createTexture(gl, filter, data, width, height) {
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    if (data instanceof Uint8Array) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}

function bindTexture(gl, texture, unit) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function updateTexture(gl, texture, src) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
}

function createBuffer(gl, data) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return buffer;
}

function bindAttribute(gl, buffer, attribute, numComponents) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute, numComponents, gl.FLOAT, false, 0, 0);
}

function bindFramebuffer(gl, framebuffer, texture) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (texture) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    }
}


const quadVert = `
precision mediump float;

attribute vec2 a_pos;
varying vec2 v_tex_pos;
void main ()
{
  v_tex_pos = a_pos;
  vec4 tmpvar_1;
  tmpvar_1.zw = vec2(0.0, 1.0);
  tmpvar_1.xy = (1.0 - (2.0 * a_pos));
  gl_Position = tmpvar_1;
}


`;

const scaleFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_size;
varying vec2 v_tex_pos;
void main ()
{
  vec2 uv_1;
  uv_1 = (1.0 - v_tex_pos);
  vec2 tmpvar_2;
  tmpvar_2 = (1.0/(u_size));
  vec2 tmpvar_3;
  tmpvar_3 = (floor((uv_1 * u_size)) * tmpvar_2);
  vec2 tmpvar_4;
  tmpvar_4 = fract((uv_1 * u_size));
  vec2 tmpvar_5;
  tmpvar_5.y = 0.0;
  tmpvar_5.x = tmpvar_2.x;
  vec2 tmpvar_6;
  tmpvar_6.x = 0.0;
  tmpvar_6.y = tmpvar_2.y;
  gl_FragColor = mix (mix (texture2D (u_texture, tmpvar_3), texture2D (u_texture, (tmpvar_3 + tmpvar_5)), tmpvar_4.x), mix (texture2D (u_texture, (tmpvar_3 + tmpvar_6)), texture2D (u_texture, (tmpvar_3 + tmpvar_2)), tmpvar_4.x), tmpvar_4.y);
}


`;

const thinLinesFrag = `
precision mediump float;
uniform sampler2D scaled_texture;
uniform float u_scale;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec4 lightestColor_1;
  vec4 tmpvar_2;
  tmpvar_2 = texture2D (scaled_texture, v_tex_pos);
  float tmpvar_3;
  tmpvar_3 = (((
    (tmpvar_2.x + tmpvar_2.x)
   + 
    (tmpvar_2.y + tmpvar_2.y)
  ) + (tmpvar_2.y + tmpvar_2.z)) / 6.0);
  vec4 tmpvar_4;
  tmpvar_4.xyz = tmpvar_2.xyz;
  tmpvar_4.w = tmpvar_3;
  vec2 tmpvar_5;
  tmpvar_5.x = 0.0;
  float tmpvar_6;
  tmpvar_6 = -(u_pt.y);
  tmpvar_5.y = tmpvar_6;
  vec2 pos_7;
  pos_7 = (v_tex_pos + tmpvar_5);
  vec4 tmpvar_8;
  tmpvar_8 = texture2D (scaled_texture, pos_7);
  vec4 tmpvar_9;
  tmpvar_9.xyz = texture2D (scaled_texture, pos_7).xyz;
  tmpvar_9.w = (((
    (tmpvar_8.x + tmpvar_8.x)
   + 
    (tmpvar_8.y + tmpvar_8.y)
  ) + (tmpvar_8.y + tmpvar_8.z)) / 6.0);
  vec2 tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(u_pt.x);
  tmpvar_10.x = tmpvar_11;
  tmpvar_10.y = tmpvar_6;
  vec2 pos_12;
  pos_12 = (v_tex_pos + tmpvar_10);
  vec4 tmpvar_13;
  tmpvar_13 = texture2D (scaled_texture, pos_12);
  vec4 tmpvar_14;
  tmpvar_14.xyz = texture2D (scaled_texture, pos_12).xyz;
  tmpvar_14.w = (((
    (tmpvar_13.x + tmpvar_13.x)
   + 
    (tmpvar_13.y + tmpvar_13.y)
  ) + (tmpvar_13.y + tmpvar_13.z)) / 6.0);
  vec2 tmpvar_15;
  tmpvar_15.x = u_pt.x;
  tmpvar_15.y = tmpvar_6;
  vec2 pos_16;
  pos_16 = (v_tex_pos + tmpvar_15);
  vec4 tmpvar_17;
  tmpvar_17 = texture2D (scaled_texture, pos_16);
  vec4 tmpvar_18;
  tmpvar_18.xyz = texture2D (scaled_texture, pos_16).xyz;
  tmpvar_18.w = (((
    (tmpvar_17.x + tmpvar_17.x)
   + 
    (tmpvar_17.y + tmpvar_17.y)
  ) + (tmpvar_17.y + tmpvar_17.z)) / 6.0);
  vec2 tmpvar_19;
  tmpvar_19.y = 0.0;
  tmpvar_19.x = tmpvar_11;
  vec2 pos_20;
  pos_20 = (v_tex_pos + tmpvar_19);
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (scaled_texture, pos_20);
  vec4 tmpvar_22;
  tmpvar_22.xyz = texture2D (scaled_texture, pos_20).xyz;
  tmpvar_22.w = (((
    (tmpvar_21.x + tmpvar_21.x)
   + 
    (tmpvar_21.y + tmpvar_21.y)
  ) + (tmpvar_21.y + tmpvar_21.z)) / 6.0);
  vec2 tmpvar_23;
  tmpvar_23.y = 0.0;
  tmpvar_23.x = u_pt.x;
  vec2 pos_24;
  pos_24 = (v_tex_pos + tmpvar_23);
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (scaled_texture, pos_24);
  vec4 tmpvar_26;
  tmpvar_26.xyz = texture2D (scaled_texture, pos_24).xyz;
  tmpvar_26.w = (((
    (tmpvar_25.x + tmpvar_25.x)
   + 
    (tmpvar_25.y + tmpvar_25.y)
  ) + (tmpvar_25.y + tmpvar_25.z)) / 6.0);
  vec2 tmpvar_27;
  tmpvar_27.x = 0.0;
  tmpvar_27.y = u_pt.y;
  vec2 pos_28;
  pos_28 = (v_tex_pos + tmpvar_27);
  vec4 tmpvar_29;
  tmpvar_29 = texture2D (scaled_texture, pos_28);
  vec4 tmpvar_30;
  tmpvar_30.xyz = texture2D (scaled_texture, pos_28).xyz;
  tmpvar_30.w = (((
    (tmpvar_29.x + tmpvar_29.x)
   + 
    (tmpvar_29.y + tmpvar_29.y)
  ) + (tmpvar_29.y + tmpvar_29.z)) / 6.0);
  vec2 tmpvar_31;
  tmpvar_31.x = tmpvar_11;
  tmpvar_31.y = u_pt.y;
  vec2 pos_32;
  pos_32 = (v_tex_pos + tmpvar_31);
  vec4 tmpvar_33;
  tmpvar_33 = texture2D (scaled_texture, pos_32);
  vec4 tmpvar_34;
  tmpvar_34.xyz = texture2D (scaled_texture, pos_32).xyz;
  tmpvar_34.w = (((
    (tmpvar_33.x + tmpvar_33.x)
   + 
    (tmpvar_33.y + tmpvar_33.y)
  ) + (tmpvar_33.y + tmpvar_33.z)) / 6.0);
  vec2 pos_35;
  pos_35 = (v_tex_pos + u_pt);
  vec4 tmpvar_36;
  tmpvar_36 = texture2D (scaled_texture, pos_35);
  vec4 tmpvar_37;
  tmpvar_37.xyz = texture2D (scaled_texture, pos_35).xyz;
  tmpvar_37.w = (((
    (tmpvar_36.x + tmpvar_36.x)
   + 
    (tmpvar_36.y + tmpvar_36.y)
  ) + (tmpvar_36.y + tmpvar_36.z)) / 6.0);
  lightestColor_1 = tmpvar_4;
  float tmpvar_38;
  tmpvar_38 = max (max (tmpvar_37.w, tmpvar_30.w), tmpvar_34.w);
  float tmpvar_39;
  tmpvar_39 = min (min (tmpvar_14.w, tmpvar_9.w), tmpvar_18.w);
  if (((tmpvar_39 > tmpvar_3) && (tmpvar_39 > tmpvar_38))) {
    vec4 tmpvar_40;
    vec4 tmpvar_41;
    float tmpvar_42;
    tmpvar_42 = (u_scale / 6.0);
    tmpvar_41 = ((tmpvar_4 * (1.0 - 
      min (tmpvar_42, 1.0)
    )) + ((
      ((tmpvar_14 + tmpvar_9) + tmpvar_18)
     / 3.0) * min (tmpvar_42, 1.0)));
    if ((tmpvar_41.w > tmpvar_3)) {
      tmpvar_40 = tmpvar_41;
    } else {
      tmpvar_40 = tmpvar_4;
    };
    lightestColor_1 = tmpvar_40;
  } else {
    float tmpvar_43;
    tmpvar_43 = max (max (tmpvar_14.w, tmpvar_9.w), tmpvar_18.w);
    float tmpvar_44;
    tmpvar_44 = min (min (tmpvar_37.w, tmpvar_30.w), tmpvar_34.w);
    if (((tmpvar_44 > tmpvar_3) && (tmpvar_44 > tmpvar_43))) {
      vec4 tmpvar_45;
      vec4 tmpvar_46;
      float tmpvar_47;
      tmpvar_47 = (u_scale / 6.0);
      tmpvar_46 = ((tmpvar_4 * (1.0 - 
        min (tmpvar_47, 1.0)
      )) + ((
        ((tmpvar_37 + tmpvar_30) + tmpvar_34)
       / 3.0) * min (tmpvar_47, 1.0)));
      if ((tmpvar_46.w > lightestColor_1.w)) {
        tmpvar_45 = tmpvar_46;
      } else {
        tmpvar_45 = lightestColor_1;
      };
      lightestColor_1 = tmpvar_45;
    };
  };
  float tmpvar_48;
  tmpvar_48 = max (max (tmpvar_3, tmpvar_22.w), tmpvar_30.w);
  float tmpvar_49;
  tmpvar_49 = min (min (tmpvar_26.w, tmpvar_9.w), tmpvar_18.w);
  if ((tmpvar_49 > tmpvar_48)) {
    vec4 tmpvar_50;
    vec4 tmpvar_51;
    float tmpvar_52;
    tmpvar_52 = (u_scale / 6.0);
    tmpvar_51 = ((tmpvar_4 * (1.0 - 
      min (tmpvar_52, 1.0)
    )) + ((
      ((tmpvar_26 + tmpvar_9) + tmpvar_18)
     / 3.0) * min (tmpvar_52, 1.0)));
    if ((tmpvar_51.w > lightestColor_1.w)) {
      tmpvar_50 = tmpvar_51;
    } else {
      tmpvar_50 = lightestColor_1;
    };
    lightestColor_1 = tmpvar_50;
  } else {
    float tmpvar_53;
    tmpvar_53 = max (max (tmpvar_3, tmpvar_26.w), tmpvar_9.w);
    float tmpvar_54;
    tmpvar_54 = min (min (tmpvar_34.w, tmpvar_22.w), tmpvar_30.w);
    if ((tmpvar_54 > tmpvar_53)) {
      vec4 tmpvar_55;
      vec4 tmpvar_56;
      float tmpvar_57;
      tmpvar_57 = (u_scale / 6.0);
      tmpvar_56 = ((tmpvar_4 * (1.0 - 
        min (tmpvar_57, 1.0)
      )) + ((
        ((tmpvar_34 + tmpvar_22) + tmpvar_30)
       / 3.0) * min (tmpvar_57, 1.0)));
      if ((tmpvar_56.w > lightestColor_1.w)) {
        tmpvar_55 = tmpvar_56;
      } else {
        tmpvar_55 = lightestColor_1;
      };
      lightestColor_1 = tmpvar_55;
    };
  };
  float tmpvar_58;
  tmpvar_58 = max (max (tmpvar_22.w, tmpvar_14.w), tmpvar_34.w);
  float tmpvar_59;
  tmpvar_59 = min (min (tmpvar_26.w, tmpvar_37.w), tmpvar_18.w);
  if (((tmpvar_59 > tmpvar_3) && (tmpvar_59 > tmpvar_58))) {
    vec4 tmpvar_60;
    vec4 tmpvar_61;
    float tmpvar_62;
    tmpvar_62 = (u_scale / 6.0);
    tmpvar_61 = ((tmpvar_4 * (1.0 - 
      min (tmpvar_62, 1.0)
    )) + ((
      ((tmpvar_26 + tmpvar_37) + tmpvar_18)
     / 3.0) * min (tmpvar_62, 1.0)));
    if ((tmpvar_61.w > lightestColor_1.w)) {
      tmpvar_60 = tmpvar_61;
    } else {
      tmpvar_60 = lightestColor_1;
    };
    lightestColor_1 = tmpvar_60;
  } else {
    float tmpvar_63;
    tmpvar_63 = max (max (tmpvar_26.w, tmpvar_37.w), tmpvar_18.w);
    float tmpvar_64;
    tmpvar_64 = min (min (tmpvar_22.w, tmpvar_14.w), tmpvar_34.w);
    if (((tmpvar_64 > tmpvar_3) && (tmpvar_64 > tmpvar_63))) {
      vec4 tmpvar_65;
      vec4 tmpvar_66;
      float tmpvar_67;
      tmpvar_67 = (u_scale / 6.0);
      tmpvar_66 = ((tmpvar_4 * (1.0 - 
        min (tmpvar_67, 1.0)
      )) + ((
        ((tmpvar_22 + tmpvar_14) + tmpvar_34)
       / 3.0) * min (tmpvar_67, 1.0)));
      if ((tmpvar_66.w > lightestColor_1.w)) {
        tmpvar_65 = tmpvar_66;
      } else {
        tmpvar_65 = lightestColor_1;
      };
      lightestColor_1 = tmpvar_65;
    };
  };
  float tmpvar_68;
  tmpvar_68 = max (max (tmpvar_3, tmpvar_22.w), tmpvar_9.w);
  float tmpvar_69;
  tmpvar_69 = min (min (tmpvar_26.w, tmpvar_37.w), tmpvar_30.w);
  if ((tmpvar_69 > tmpvar_68)) {
    vec4 tmpvar_70;
    vec4 tmpvar_71;
    float tmpvar_72;
    tmpvar_72 = (u_scale / 6.0);
    tmpvar_71 = ((tmpvar_4 * (1.0 - 
      min (tmpvar_72, 1.0)
    )) + ((
      ((tmpvar_26 + tmpvar_37) + tmpvar_30)
     / 3.0) * min (tmpvar_72, 1.0)));
    if ((tmpvar_71.w > lightestColor_1.w)) {
      tmpvar_70 = tmpvar_71;
    } else {
      tmpvar_70 = lightestColor_1;
    };
    lightestColor_1 = tmpvar_70;
  } else {
    float tmpvar_73;
    tmpvar_73 = max (max (tmpvar_3, tmpvar_26.w), tmpvar_30.w);
    float tmpvar_74;
    tmpvar_74 = min (min (tmpvar_9.w, tmpvar_22.w), tmpvar_14.w);
    if ((tmpvar_74 > tmpvar_73)) {
      vec4 tmpvar_75;
      vec4 tmpvar_76;
      float tmpvar_77;
      tmpvar_77 = (u_scale / 6.0);
      tmpvar_76 = ((tmpvar_4 * (1.0 - 
        min (tmpvar_77, 1.0)
      )) + ((
        ((tmpvar_9 + tmpvar_22) + tmpvar_14)
       / 3.0) * min (tmpvar_77, 1.0)));
      if ((tmpvar_76.w > lightestColor_1.w)) {
        tmpvar_75 = tmpvar_76;
      } else {
        tmpvar_75 = lightestColor_1;
      };
      lightestColor_1 = tmpvar_75;
    };
  };
  gl_FragColor = lightestColor_1;
}


`;

const lumaFrag = `
precision mediump float;

uniform sampler2D scaled_texture;
varying vec2 v_tex_pos;
void main ()
{
  vec4 tmpvar_1;
  tmpvar_1 = texture2D (scaled_texture, v_tex_pos);
  gl_FragColor = vec4((((
    (tmpvar_1.x + tmpvar_1.x)
   + 
    (tmpvar_1.y + tmpvar_1.y)
  ) + (tmpvar_1.y + tmpvar_1.z)) / 6.0));
}


`;

const lumaGausXFrag = `
precision mediump float;

uniform sampler2D post_kernel_texture;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.y = 0.0;
  tmpvar_1.x = u_pt.x;
  float g_2;
  g_2 = ((texture2D (post_kernel_texture, (v_tex_pos - 
    (tmpvar_1 * 2.0)
  )).x * 0.187691) + (texture2D (post_kernel_texture, (v_tex_pos - tmpvar_1)).x * 0.206038));
  vec4 tmpvar_3;
  tmpvar_3 = texture2D (post_kernel_texture, v_tex_pos);
  g_2 = (g_2 + (tmpvar_3.x * 0.212543));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + 
    (tmpvar_1 * 2.0)
  )).x * 0.187691));
  vec4 tmpvar_4;
  tmpvar_4.x = tmpvar_3.x;
  tmpvar_4.y = clamp (g_2, 0.0, 1.0);
  tmpvar_4.zw = tmpvar_3.zw;
  gl_FragColor = tmpvar_4;
}


`;

const lumaGausYFrag = `
precision mediump float;

uniform sampler2D post_kernel_texture;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = 0.0;
  tmpvar_1.y = u_pt.y;
  float g_2;
  g_2 = ((texture2D (post_kernel_texture, (v_tex_pos - 
    (tmpvar_1 * 2.0)
  )).x * 0.187691) + (texture2D (post_kernel_texture, (v_tex_pos - tmpvar_1)).x * 0.206038));
  vec4 tmpvar_3;
  tmpvar_3 = texture2D (post_kernel_texture, v_tex_pos);
  g_2 = (g_2 + (tmpvar_3.x * 0.212543));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + 
    (tmpvar_1 * 2.0)
  )).x * 0.187691));
  vec4 tmpvar_4;
  tmpvar_4.x = tmpvar_3.x;
  tmpvar_4.y = clamp (g_2, 0.0, 1.0);
  tmpvar_4.zw = tmpvar_3.zw;
  gl_FragColor = tmpvar_4;
}


`;

const lineDetectFrag = `
precision mediump float;

uniform sampler2D post_kernel_texture;
varying vec2 v_tex_pos;
void main ()
{
  float tmpvar_1;
  vec4 tmpvar_2;
  tmpvar_2 = texture2D (post_kernel_texture, v_tex_pos);
  tmpvar_1 = clamp (tmpvar_2.x, 0.001, 0.999);
  float tmpvar_3;
  tmpvar_3 = clamp (tmpvar_2.y, 0.001, 0.999);
  float tmpvar_4;
  if ((tmpvar_3 == 1.0)) {
    tmpvar_4 = tmpvar_3;
  } else {
    tmpvar_4 = min ((tmpvar_1 / tmpvar_3), 1.0);
  };
  vec4 tmpvar_5;
  tmpvar_5.yzw = vec3(0.0, 0.0, 0.0);
  tmpvar_5.x = (1.0 - clamp ((tmpvar_4 - 0.05), 0.0, 1.0));
  gl_FragColor = tmpvar_5;
}


`;

const lineGausXFrag = `
precision mediump float;
uniform sampler2D post_kernel_texture;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.y = 0.0;
  tmpvar_1.x = u_pt.x;
  float g_2;
  g_2 = ((texture2D (post_kernel_texture, (v_tex_pos - 
    (tmpvar_1 * 2.0)
  )).x * 0.187691) + (texture2D (post_kernel_texture, (v_tex_pos - tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, v_tex_pos).x * 0.212543));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + 
    (tmpvar_1 * 2.0)
  )).x * 0.187691));
  vec4 tmpvar_3;
  tmpvar_3.yzw = vec3(0.0, 0.0, 0.0);
  tmpvar_3.x = clamp (g_2, 0.0, 1.0);
  gl_FragColor = tmpvar_3;
}


`;

const lineGausYFrag = `
precision mediump float;
uniform sampler2D post_kernel_texture;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = 0.0;
  tmpvar_1.y = u_pt.y;
  float g_2;
  g_2 = ((texture2D (post_kernel_texture, (v_tex_pos - 
    (tmpvar_1 * 2.0)
  )).x * 0.187691) + (texture2D (post_kernel_texture, (v_tex_pos - tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, v_tex_pos).x * 0.212543));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + tmpvar_1)).x * 0.206038));
  g_2 = (g_2 + (texture2D (post_kernel_texture, (v_tex_pos + 
    (tmpvar_1 * 2.0)
  )).x * 0.187691));
  vec4 tmpvar_3;
  tmpvar_3.yzw = vec3(0.0, 0.0, 0.0);
  tmpvar_3.x = clamp (g_2, 0.0, 1.0);
  gl_FragColor = tmpvar_3;
}


`;

const gradFrag = `
precision mediump float;

uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform vec2 u_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = 0.0;
  float tmpvar_2;
  tmpvar_2 = -(u_pt.y);
  tmpvar_1.y = tmpvar_2;
  vec2 pos_3;
  pos_3 = (v_tex_pos + tmpvar_1);
  vec4 tmpvar_4;
  tmpvar_4.xyz = texture2D (u_texture, (1.0 - pos_3)).xyz;
  tmpvar_4.w = texture2D (u_textureTemp, (1.0 - pos_3)).x;
  vec2 tmpvar_5;
  float tmpvar_6;
  tmpvar_6 = -(u_pt.x);
  tmpvar_5.x = tmpvar_6;
  tmpvar_5.y = tmpvar_2;
  vec2 pos_7;
  pos_7 = (v_tex_pos + tmpvar_5);
  vec4 tmpvar_8;
  tmpvar_8.xyz = texture2D (u_texture, (1.0 - pos_7)).xyz;
  tmpvar_8.w = texture2D (u_textureTemp, (1.0 - pos_7)).x;
  vec2 tmpvar_9;
  tmpvar_9.x = u_pt.x;
  tmpvar_9.y = tmpvar_2;
  vec2 pos_10;
  pos_10 = (v_tex_pos + tmpvar_9);
  vec4 tmpvar_11;
  tmpvar_11.xyz = texture2D (u_texture, (1.0 - pos_10)).xyz;
  tmpvar_11.w = texture2D (u_textureTemp, (1.0 - pos_10)).x;
  vec2 tmpvar_12;
  tmpvar_12.y = 0.0;
  tmpvar_12.x = tmpvar_6;
  vec2 pos_13;
  pos_13 = (v_tex_pos + tmpvar_12);
  vec4 tmpvar_14;
  tmpvar_14.xyz = texture2D (u_texture, (1.0 - pos_13)).xyz;
  tmpvar_14.w = texture2D (u_textureTemp, (1.0 - pos_13)).x;
  vec2 tmpvar_15;
  tmpvar_15.y = 0.0;
  tmpvar_15.x = u_pt.x;
  vec2 pos_16;
  pos_16 = (v_tex_pos + tmpvar_15);
  vec4 tmpvar_17;
  tmpvar_17.xyz = texture2D (u_texture, (1.0 - pos_16)).xyz;
  tmpvar_17.w = texture2D (u_textureTemp, (1.0 - pos_16)).x;
  vec2 tmpvar_18;
  tmpvar_18.x = 0.0;
  tmpvar_18.y = u_pt.y;
  vec2 pos_19;
  pos_19 = (v_tex_pos + tmpvar_18);
  vec4 tmpvar_20;
  tmpvar_20.xyz = texture2D (u_texture, (1.0 - pos_19)).xyz;
  tmpvar_20.w = texture2D (u_textureTemp, (1.0 - pos_19)).x;
  vec2 tmpvar_21;
  tmpvar_21.x = tmpvar_6;
  tmpvar_21.y = u_pt.y;
  vec2 pos_22;
  pos_22 = (v_tex_pos + tmpvar_21);
  vec4 tmpvar_23;
  tmpvar_23.xyz = texture2D (u_texture, (1.0 - pos_22)).xyz;
  tmpvar_23.w = texture2D (u_textureTemp, (1.0 - pos_22)).x;
  vec2 pos_24;
  pos_24 = (v_tex_pos + u_pt);
  vec4 tmpvar_25;
  tmpvar_25.xyz = texture2D (u_texture, (1.0 - pos_24)).xyz;
  tmpvar_25.w = texture2D (u_textureTemp, (1.0 - pos_24)).x;
  float tmpvar_26;
  tmpvar_26 = (((
    ((((
      -(tmpvar_8.w)
     + tmpvar_11.w) - tmpvar_14.w) - tmpvar_14.w) + tmpvar_17.w)
   + tmpvar_17.w) - tmpvar_23.w) + tmpvar_25.w);
  float tmpvar_27;
  tmpvar_27 = (((
    ((((
      -(tmpvar_8.w)
     - tmpvar_4.w) - tmpvar_4.w) - tmpvar_11.w) + tmpvar_23.w)
   + tmpvar_20.w) + tmpvar_20.w) + tmpvar_25.w);
  gl_FragColor = vec4((1.0 - clamp (sqrt(
    ((tmpvar_26 * tmpvar_26) + (tmpvar_27 * tmpvar_27))
  ), 0.0, 1.0)));
}


`;

const refineFrag = `
precision mediump float;
uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform vec2 u_pt;
uniform float u_scale;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = v_tex_pos.x;
  float tmpvar_2;
  tmpvar_2 = (1.0 - v_tex_pos.y);
  tmpvar_1.y = tmpvar_2;
  vec2 tmpvar_3;
  tmpvar_3.x = v_tex_pos.x;
  tmpvar_3.y = tmpvar_2;
  vec4 tmpvar_4;
  tmpvar_4.xyz = texture2D (u_texture, tmpvar_1).xyz;
  tmpvar_4.w = texture2D (u_textureTemp, tmpvar_3).z;
  vec2 tmpvar_5;
  tmpvar_5.x = 0.0;
  float tmpvar_6;
  tmpvar_6 = -(u_pt.y);
  tmpvar_5.y = tmpvar_6;
  vec2 pos_7;
  pos_7 = (v_tex_pos + tmpvar_5);
  vec2 tmpvar_8;
  tmpvar_8.x = pos_7.x;
  tmpvar_8.y = (1.0 - pos_7.y);
  vec2 tmpvar_9;
  tmpvar_9.x = pos_7.x;
  tmpvar_9.y = (1.0 - pos_7.y);
  vec4 tmpvar_10;
  tmpvar_10.xyz = texture2D (u_texture, tmpvar_8).xyz;
  tmpvar_10.w = texture2D (u_textureTemp, tmpvar_9).z;
  vec2 tmpvar_11;
  float tmpvar_12;
  tmpvar_12 = -(u_pt.x);
  tmpvar_11.x = tmpvar_12;
  tmpvar_11.y = tmpvar_6;
  vec2 pos_13;
  pos_13 = (v_tex_pos + tmpvar_11);
  vec2 tmpvar_14;
  tmpvar_14.x = pos_13.x;
  tmpvar_14.y = (1.0 - pos_13.y);
  vec2 tmpvar_15;
  tmpvar_15.x = pos_13.x;
  tmpvar_15.y = (1.0 - pos_13.y);
  vec4 tmpvar_16;
  tmpvar_16.xyz = texture2D (u_texture, tmpvar_14).xyz;
  tmpvar_16.w = texture2D (u_textureTemp, tmpvar_15).z;
  vec2 tmpvar_17;
  tmpvar_17.x = u_pt.x;
  tmpvar_17.y = tmpvar_6;
  vec2 pos_18;
  pos_18 = (v_tex_pos + tmpvar_17);
  vec2 tmpvar_19;
  tmpvar_19.x = pos_18.x;
  tmpvar_19.y = (1.0 - pos_18.y);
  vec2 tmpvar_20;
  tmpvar_20.x = pos_18.x;
  tmpvar_20.y = (1.0 - pos_18.y);
  vec4 tmpvar_21;
  tmpvar_21.xyz = texture2D (u_texture, tmpvar_19).xyz;
  tmpvar_21.w = texture2D (u_textureTemp, tmpvar_20).z;
  vec2 tmpvar_22;
  tmpvar_22.y = 0.0;
  tmpvar_22.x = tmpvar_12;
  vec2 pos_23;
  pos_23 = (v_tex_pos + tmpvar_22);
  vec2 tmpvar_24;
  tmpvar_24.x = pos_23.x;
  tmpvar_24.y = (1.0 - pos_23.y);
  vec2 tmpvar_25;
  tmpvar_25.x = pos_23.x;
  tmpvar_25.y = (1.0 - pos_23.y);
  vec4 tmpvar_26;
  tmpvar_26.xyz = texture2D (u_texture, tmpvar_24).xyz;
  tmpvar_26.w = texture2D (u_textureTemp, tmpvar_25).z;
  vec2 tmpvar_27;
  tmpvar_27.y = 0.0;
  tmpvar_27.x = u_pt.x;
  vec2 pos_28;
  pos_28 = (v_tex_pos + tmpvar_27);
  vec2 tmpvar_29;
  tmpvar_29.x = pos_28.x;
  tmpvar_29.y = (1.0 - pos_28.y);
  vec2 tmpvar_30;
  tmpvar_30.x = pos_28.x;
  tmpvar_30.y = (1.0 - pos_28.y);
  vec4 tmpvar_31;
  tmpvar_31.xyz = texture2D (u_texture, tmpvar_29).xyz;
  tmpvar_31.w = texture2D (u_textureTemp, tmpvar_30).z;
  vec2 tmpvar_32;
  tmpvar_32.x = 0.0;
  tmpvar_32.y = u_pt.y;
  vec2 pos_33;
  pos_33 = (v_tex_pos + tmpvar_32);
  vec2 tmpvar_34;
  tmpvar_34.x = pos_33.x;
  tmpvar_34.y = (1.0 - pos_33.y);
  vec2 tmpvar_35;
  tmpvar_35.x = pos_33.x;
  tmpvar_35.y = (1.0 - pos_33.y);
  vec4 tmpvar_36;
  tmpvar_36.xyz = texture2D (u_texture, tmpvar_34).xyz;
  tmpvar_36.w = texture2D (u_textureTemp, tmpvar_35).z;
  vec2 tmpvar_37;
  tmpvar_37.x = tmpvar_12;
  tmpvar_37.y = u_pt.y;
  vec2 pos_38;
  pos_38 = (v_tex_pos + tmpvar_37);
  vec2 tmpvar_39;
  tmpvar_39.x = pos_38.x;
  tmpvar_39.y = (1.0 - pos_38.y);
  vec2 tmpvar_40;
  tmpvar_40.x = pos_38.x;
  tmpvar_40.y = (1.0 - pos_38.y);
  vec4 tmpvar_41;
  tmpvar_41.xyz = texture2D (u_texture, tmpvar_39).xyz;
  tmpvar_41.w = texture2D (u_textureTemp, tmpvar_40).z;
  vec2 pos_42;
  pos_42 = (v_tex_pos + u_pt);
  vec2 tmpvar_43;
  tmpvar_43.x = pos_42.x;
  tmpvar_43.y = (1.0 - pos_42.y);
  vec2 tmpvar_44;
  tmpvar_44.x = pos_42.x;
  tmpvar_44.y = (1.0 - pos_42.y);
  vec4 tmpvar_45;
  tmpvar_45.xyz = texture2D (u_texture, tmpvar_43).xyz;
  tmpvar_45.w = texture2D (u_textureTemp, tmpvar_44).z;
  float tmpvar_46;
  tmpvar_46 = max (max (tmpvar_45.w, tmpvar_36.w), tmpvar_41.w);
  float tmpvar_47;
  tmpvar_47 = min (min (tmpvar_16.w, tmpvar_10.w), tmpvar_21.w);
  if (((tmpvar_47 > tmpvar_4.w) && (tmpvar_47 > tmpvar_46))) {
    float prob_48;
    vec2 tmpvar_49;
    tmpvar_49.x = v_tex_pos.x;
    tmpvar_49.y = (1.0 - v_tex_pos.y);
    float tmpvar_50;
    tmpvar_50 = clamp ((texture2D (u_textureTemp, tmpvar_49).y * 8.0), 0.0, 1.0);
    prob_48 = tmpvar_50;
    if ((tmpvar_50 < 0.2)) {
      prob_48 = 0.0;
    };
    float tmpvar_51;
    tmpvar_51 = clamp ((min (u_scale, 1.0) * prob_48), 0.0, 1.0);
    gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_51)) + ((
      ((tmpvar_16 + tmpvar_10) + tmpvar_21)
     / 3.0) * tmpvar_51));
    return;
  } else {
    float tmpvar_52;
    tmpvar_52 = max (max (tmpvar_16.w, tmpvar_10.w), tmpvar_21.w);
    float tmpvar_53;
    tmpvar_53 = min (min (tmpvar_45.w, tmpvar_36.w), tmpvar_41.w);
    if (((tmpvar_53 > tmpvar_4.w) && (tmpvar_53 > tmpvar_52))) {
      float prob_54;
      vec2 tmpvar_55;
      tmpvar_55.x = v_tex_pos.x;
      tmpvar_55.y = (1.0 - v_tex_pos.y);
      float tmpvar_56;
      tmpvar_56 = clamp ((texture2D (u_textureTemp, tmpvar_55).y * 8.0), 0.0, 1.0);
      prob_54 = tmpvar_56;
      if ((tmpvar_56 < 0.2)) {
        prob_54 = 0.0;
      };
      float tmpvar_57;
      tmpvar_57 = clamp ((min (u_scale, 1.0) * prob_54), 0.0, 1.0);
      gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_57)) + ((
        ((tmpvar_45 + tmpvar_36) + tmpvar_41)
       / 3.0) * tmpvar_57));
      return;
    };
  };
  float tmpvar_58;
  tmpvar_58 = max (max (tmpvar_4.w, tmpvar_26.w), tmpvar_36.w);
  float tmpvar_59;
  tmpvar_59 = min (min (tmpvar_31.w, tmpvar_10.w), tmpvar_21.w);
  if ((tmpvar_59 > tmpvar_58)) {
    float prob_60;
    vec2 tmpvar_61;
    tmpvar_61.x = v_tex_pos.x;
    tmpvar_61.y = (1.0 - v_tex_pos.y);
    float tmpvar_62;
    tmpvar_62 = clamp ((texture2D (u_textureTemp, tmpvar_61).y * 8.0), 0.0, 1.0);
    prob_60 = tmpvar_62;
    if ((tmpvar_62 < 0.2)) {
      prob_60 = 0.0;
    };
    float tmpvar_63;
    tmpvar_63 = clamp ((min (u_scale, 1.0) * prob_60), 0.0, 1.0);
    gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_63)) + ((
      ((tmpvar_31 + tmpvar_10) + tmpvar_21)
     / 3.0) * tmpvar_63));
    return;
  } else {
    float tmpvar_64;
    tmpvar_64 = max (max (tmpvar_4.w, tmpvar_31.w), tmpvar_10.w);
    float tmpvar_65;
    tmpvar_65 = min (min (tmpvar_41.w, tmpvar_26.w), tmpvar_36.w);
    if ((tmpvar_65 > tmpvar_64)) {
      float prob_66;
      vec2 tmpvar_67;
      tmpvar_67.x = v_tex_pos.x;
      tmpvar_67.y = (1.0 - v_tex_pos.y);
      float tmpvar_68;
      tmpvar_68 = clamp ((texture2D (u_textureTemp, tmpvar_67).y * 8.0), 0.0, 1.0);
      prob_66 = tmpvar_68;
      if ((tmpvar_68 < 0.2)) {
        prob_66 = 0.0;
      };
      float tmpvar_69;
      tmpvar_69 = clamp ((min (u_scale, 1.0) * prob_66), 0.0, 1.0);
      gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_69)) + ((
        ((tmpvar_41 + tmpvar_26) + tmpvar_36)
       / 3.0) * tmpvar_69));
      return;
    };
  };
  float tmpvar_70;
  tmpvar_70 = max (max (tmpvar_26.w, tmpvar_16.w), tmpvar_41.w);
  float tmpvar_71;
  tmpvar_71 = min (min (tmpvar_31.w, tmpvar_45.w), tmpvar_21.w);
  if (((tmpvar_71 > tmpvar_4.w) && (tmpvar_71 > tmpvar_70))) {
    float prob_72;
    vec2 tmpvar_73;
    tmpvar_73.x = v_tex_pos.x;
    tmpvar_73.y = (1.0 - v_tex_pos.y);
    float tmpvar_74;
    tmpvar_74 = clamp ((texture2D (u_textureTemp, tmpvar_73).y * 8.0), 0.0, 1.0);
    prob_72 = tmpvar_74;
    if ((tmpvar_74 < 0.2)) {
      prob_72 = 0.0;
    };
    float tmpvar_75;
    tmpvar_75 = clamp ((min (u_scale, 1.0) * prob_72), 0.0, 1.0);
    gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_75)) + ((
      ((tmpvar_31 + tmpvar_45) + tmpvar_21)
     / 3.0) * tmpvar_75));
    return;
  } else {
    float tmpvar_76;
    tmpvar_76 = max (max (tmpvar_31.w, tmpvar_45.w), tmpvar_21.w);
    float tmpvar_77;
    tmpvar_77 = min (min (tmpvar_26.w, tmpvar_16.w), tmpvar_41.w);
    if (((tmpvar_77 > tmpvar_4.w) && (tmpvar_77 > tmpvar_76))) {
      float prob_78;
      vec2 tmpvar_79;
      tmpvar_79.x = v_tex_pos.x;
      tmpvar_79.y = (1.0 - v_tex_pos.y);
      float tmpvar_80;
      tmpvar_80 = clamp ((texture2D (u_textureTemp, tmpvar_79).y * 8.0), 0.0, 1.0);
      prob_78 = tmpvar_80;
      if ((tmpvar_80 < 0.2)) {
        prob_78 = 0.0;
      };
      float tmpvar_81;
      tmpvar_81 = clamp ((min (u_scale, 1.0) * prob_78), 0.0, 1.0);
      gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_81)) + ((
        ((tmpvar_26 + tmpvar_16) + tmpvar_41)
       / 3.0) * tmpvar_81));
      return;
    };
  };
  float tmpvar_82;
  tmpvar_82 = max (max (tmpvar_4.w, tmpvar_26.w), tmpvar_10.w);
  float tmpvar_83;
  tmpvar_83 = min (min (tmpvar_31.w, tmpvar_45.w), tmpvar_36.w);
  if ((tmpvar_83 > tmpvar_82)) {
    float prob_84;
    vec2 tmpvar_85;
    tmpvar_85.x = v_tex_pos.x;
    tmpvar_85.y = (1.0 - v_tex_pos.y);
    float tmpvar_86;
    tmpvar_86 = clamp ((texture2D (u_textureTemp, tmpvar_85).y * 8.0), 0.0, 1.0);
    prob_84 = tmpvar_86;
    if ((tmpvar_86 < 0.2)) {
      prob_84 = 0.0;
    };
    float tmpvar_87;
    tmpvar_87 = clamp ((min (u_scale, 1.0) * prob_84), 0.0, 1.0);
    gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_87)) + ((
      ((tmpvar_31 + tmpvar_45) + tmpvar_36)
     / 3.0) * tmpvar_87));
    return;
  } else {
    float tmpvar_88;
    tmpvar_88 = max (max (tmpvar_4.w, tmpvar_31.w), tmpvar_36.w);
    float tmpvar_89;
    tmpvar_89 = min (min (tmpvar_10.w, tmpvar_26.w), tmpvar_16.w);
    if ((tmpvar_89 > tmpvar_88)) {
      float prob_90;
      vec2 tmpvar_91;
      tmpvar_91.x = v_tex_pos.x;
      tmpvar_91.y = (1.0 - v_tex_pos.y);
      float tmpvar_92;
      tmpvar_92 = clamp ((texture2D (u_textureTemp, tmpvar_91).y * 8.0), 0.0, 1.0);
      prob_90 = tmpvar_92;
      if ((tmpvar_92 < 0.2)) {
        prob_90 = 0.0;
      };
      float tmpvar_93;
      tmpvar_93 = clamp ((min (u_scale, 1.0) * prob_90), 0.0, 1.0);
      gl_FragColor = ((tmpvar_4 * (1.0 - tmpvar_93)) + ((
        ((tmpvar_10 + tmpvar_26) + tmpvar_16)
       / 3.0) * tmpvar_93));
      return;
    };
  };
  gl_FragColor = tmpvar_4;
}


`;

const fxaaFrag = `
precision mediump float;
uniform sampler2D u_texture;
uniform sampler2D u_textureTemp;
uniform highp vec2 u_pt;
uniform highp float u_scale;
varying highp vec2 v_tex_pos;
void main ()
{
  lowp vec2 dir_1;
  lowp vec4 xc_2;
  highp vec2 tmpvar_3;
  tmpvar_3.x = v_tex_pos.x;
  highp float tmpvar_4;
  tmpvar_4 = (1.0 - v_tex_pos.y);
  tmpvar_3.y = tmpvar_4;
  lowp vec4 tmpvar_5;
  tmpvar_5 = texture2D (u_texture, tmpvar_3);
  xc_2 = tmpvar_5;
  highp float tmpvar_6;
  tmpvar_6 = -(u_pt.y);
  highp float tmpvar_7;
  tmpvar_7 = -(u_pt.x);
  highp vec2 tmpvar_8;
  tmpvar_8.x = tmpvar_7;
  tmpvar_8.y = tmpvar_6;
  highp vec2 pos_9;
  pos_9 = (v_tex_pos + tmpvar_8);
  highp vec2 tmpvar_10;
  tmpvar_10.x = pos_9.x;
  tmpvar_10.y = (1.0 - pos_9.y);
  lowp vec4 tmpvar_11;
  tmpvar_11 = texture2D (u_textureTemp, tmpvar_10);
  highp vec2 tmpvar_12;
  tmpvar_12.x = u_pt.x;
  tmpvar_12.y = tmpvar_6;
  highp vec2 pos_13;
  pos_13 = (v_tex_pos + tmpvar_12);
  highp vec2 tmpvar_14;
  tmpvar_14.x = pos_13.x;
  tmpvar_14.y = (1.0 - pos_13.y);
  lowp vec4 tmpvar_15;
  tmpvar_15 = texture2D (u_textureTemp, tmpvar_14);
  highp vec2 tmpvar_16;
  tmpvar_16.x = tmpvar_7;
  tmpvar_16.y = u_pt.y;
  highp vec2 pos_17;
  pos_17 = (v_tex_pos + tmpvar_16);
  highp vec2 tmpvar_18;
  tmpvar_18.x = pos_17.x;
  tmpvar_18.y = (1.0 - pos_17.y);
  lowp vec4 tmpvar_19;
  tmpvar_19 = texture2D (u_textureTemp, tmpvar_18);
  highp vec2 pos_20;
  pos_20 = (v_tex_pos + u_pt);
  highp vec2 tmpvar_21;
  tmpvar_21.x = pos_20.x;
  tmpvar_21.y = (1.0 - pos_20.y);
  lowp vec4 tmpvar_22;
  tmpvar_22 = texture2D (u_textureTemp, tmpvar_21);
  highp vec2 tmpvar_23;
  tmpvar_23.x = v_tex_pos.x;
  tmpvar_23.y = tmpvar_4;
  lowp vec4 tmpvar_24;
  tmpvar_24 = texture2D (u_textureTemp, tmpvar_23);
  lowp float tmpvar_25;
  tmpvar_25 = min (min (tmpvar_24.x, tmpvar_11.x), min (min (tmpvar_15.x, tmpvar_19.x), tmpvar_22.x));
  lowp float tmpvar_26;
  tmpvar_26 = max (max (tmpvar_24.x, tmpvar_11.x), max (max (tmpvar_15.x, tmpvar_19.x), tmpvar_22.x));
  lowp vec2 tmpvar_27;
  tmpvar_27.x = (((
    -(tmpvar_11.x)
   - tmpvar_15.x) + tmpvar_19.x) + tmpvar_22.x);
  tmpvar_27.y = (((tmpvar_11.x - tmpvar_15.x) + tmpvar_19.x) - tmpvar_22.x);
  dir_1 = (min (vec2(8.0, 8.0), max (vec2(-8.0, -8.0), 
    (tmpvar_27 * (1.0/((min (
      abs(tmpvar_27.x)
    , 
      abs(tmpvar_27.y)
    ) + max (
      (((tmpvar_11.x + tmpvar_15.x) + (tmpvar_19.x + tmpvar_22.x)) * 0.03125)
    , 0.0078125)))))
  )) * u_pt);
  lowp vec2 pos_28;
  pos_28 = (v_tex_pos + (dir_1 * -0.1666667));
  lowp vec2 tmpvar_29;
  tmpvar_29.x = pos_28.x;
  tmpvar_29.y = (1.0 - pos_28.y);
  lowp vec2 pos_30;
  pos_30 = (v_tex_pos + (dir_1 * 0.1666667));
  lowp vec2 tmpvar_31;
  tmpvar_31.x = pos_30.x;
  tmpvar_31.y = (1.0 - pos_30.y);
  lowp vec4 tmpvar_32;
  tmpvar_32 = (0.5 * (texture2D (u_texture, tmpvar_29) + texture2D (u_texture, tmpvar_31)));
  lowp vec2 pos_33;
  pos_33 = (v_tex_pos + (dir_1 * -0.5));
  lowp vec2 tmpvar_34;
  tmpvar_34.x = pos_33.x;
  tmpvar_34.y = (1.0 - pos_33.y);
  lowp vec2 pos_35;
  pos_35 = (v_tex_pos + (dir_1 * 0.5));
  lowp vec2 tmpvar_36;
  tmpvar_36.x = pos_35.x;
  tmpvar_36.y = (1.0 - pos_35.y);
  lowp vec4 tmpvar_37;
  tmpvar_37 = ((tmpvar_32 * 0.5) + (0.25 * (texture2D (u_texture, tmpvar_34) + texture2D (u_texture, tmpvar_36))));
  lowp float tmpvar_38;
  tmpvar_38 = (((
    (tmpvar_37.x + tmpvar_37.x)
   + 
    (tmpvar_37.y + tmpvar_37.y)
  ) + (tmpvar_37.y + tmpvar_37.z)) / 6.0);
  if (((tmpvar_38 < tmpvar_25) || (tmpvar_38 > tmpvar_26))) {
    xc_2 = tmpvar_32;
  } else {
    xc_2 = tmpvar_37;
  };
  mediump vec4 tmpvar_39;
  lowp float prob_40;
  highp vec2 tmpvar_41;
  tmpvar_41.x = v_tex_pos.x;
  tmpvar_41.y = (1.0 - v_tex_pos.y);
  lowp float tmpvar_42;
  tmpvar_42 = clamp ((texture2D (u_textureTemp, tmpvar_41).y * 4.0), 0.0, 1.0);
  prob_40 = tmpvar_42;
  if ((tmpvar_42 < 0.2)) {
    prob_40 = 0.0;
  };
  lowp float tmpvar_43;
  tmpvar_43 = clamp ((min (u_scale, 1.0) * prob_40), 0.0, 1.0);
  tmpvar_39 = ((tmpvar_5 * (1.0 - tmpvar_43)) + (xc_2 * tmpvar_43));
  gl_FragColor = tmpvar_39;
}


`;

const drawFrag = `
precision mediump float;

uniform sampler2D u_texture;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = v_tex_pos.x;
  tmpvar_1.y = (1.0 - v_tex_pos.y);
  gl_FragColor = texture2D (u_texture, tmpvar_1);
}


`;


function Scaler(gl) {
    this.gl = gl;

    this.inputTex = null;
    this.inputMov = null;
    this.inputWidth = 0;
    this.inputHeight = 0;

    this.quadBuffer = createBuffer(gl, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]));
    this.framebuffer = gl.createFramebuffer();

    console.log('Compiling shaders...')
    this.scaleProgram = createProgram(gl, quadVert, scaleFrag);
    this.thinLinesProgram = createProgram(gl, quadVert, thinLinesFrag);
    this.lumaProgram = createProgram(gl, quadVert, lumaFrag);
    this.lumaGausXProgram = createProgram(gl, quadVert, lumaGausXFrag);
    this.lumaGausYProgram = createProgram(gl, quadVert, lumaGausYFrag);
    this.lineDetectProgram = createProgram(gl, quadVert, lineDetectFrag);
    this.lineGausXProgram = createProgram(gl, quadVert, lineGausXFrag);
    this.lineGausYProgram = createProgram(gl, quadVert, lineGausYFrag);
    this.gradProgram = createProgram(gl, quadVert, gradFrag);
    this.refineProgram = createProgram(gl, quadVert, refineFrag);
    this.fxaaProgram = createProgram(gl, quadVert, fxaaFrag);
    this.drawProgram = createProgram(gl, quadVert, drawFrag);

    this.postKernelTexture = null;
    this.postKernelTexture2 = null;

    this.scale = 1.0;
    this.screenRatio = window.screen.width/window.screen.height;
    this.playerRatio = 16/9 // Assuming default player ratio is 16:9 (this is true for Bilibili and ACFun).
    this.isLoggedPaused = false;
    this.isFullscreen = true;   // Setting this to true to resize the board on start.
    console.log("Default screen aspect ratio is set to " + this.screenRatio)
}

Scaler.prototype.inputImage = function (img) {
    const gl = this.gl;

    this.inputWidth = img.width;
    this.inputHeight = img.height;

    this.inputTex = createTexture(gl, gl.LINEAR, img);
    this.inputMov = null;
}

Scaler.prototype.inputVideo = function (mov) {
    const gl = this.gl;

    const width = mov.videoWidth;
    const height = mov.videoHeight;

    this.inputWidth = width;
    this.inputHeight = height;

    let emptyPixels = new Uint8Array(width * height * 4);
    this.inputTex = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.inputMov = mov;
}

Scaler.prototype.resize = function (scale) {
    const gl = this.gl;

    const width = Math.round(this.inputWidth * scale);
    const height = Math.round(this.inputHeight * scale);

    gl.canvas.width = width;
    gl.canvas.height = height;

    let emptyPixels = new Uint8Array(width * height * 4);
    this.scaleTexture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.scaleTexture2 = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.postKernelTexture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.postKernelTexture2 = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
}

Scaler.prototype.resizeBoard = function(originRatio, newRatio){
    if (Math.abs(originRatio-newRatio) > 0.001){    // To prevent precision-caused problem.
        console.log("Video ratio mismatched!")
        console.log("Video Ratio: " + originRatio)
        console.log("Screen ratio: " + newRatio)
        if(originRatio>newRatio){   // Not-so-wide screen, change height.
            let newHeight = newRatio/originRatio*100
            console.log("Setting new height precentage: " + newHeight + "%")
            globalBoard.style.height = newHeight + "%"
            globalBoard.style.marginTop = (100-newHeight)/3 + "%"
        } else {    // Wide screen, change width.
            let newWidth = originRatio/newRatio*100
            console.log("Setting new width precentage: " + newWidth + "%")
            globalBoard.style.width = newWidth + "%"
            globalBoard.style.marginLeft = (100-newWidth)/2 + "%"
        }
    }
}

Scaler.prototype.render = async function () {
    if (!this.inputTex) {
        return;
    }

    const gl = this.gl;
    const scalePgm = this.scaleProgram;
    const thinLinesPgm = this.thinLinesProgram;
    const lumaPgm = this.lumaProgram;
    const lumaGausXPgm = this.lumaGausXProgram;
    const lumaGausYPgm = this.lumaGausYProgram;
    const lineDetectPgm = this.lineDetectProgram;
    const lineGausXPgm = this.lineGausXProgram;
    const lineGausYPgm = this.lineGausYProgram;
    const gradPgm = this.gradProgram;
    const refinePgm = this.refineProgram;
    const fxaaPgm = this.fxaaProgram;
    const drawPgm = this.drawProgram;

    // Nasty trick to fix video quailty changing bug.
    if (gl.getError() == gl.INVALID_VALUE) {
        console.log('glError detected! Fetching new viedo tag... (This may happen due to resolution change)')
        let newMov = await getVideoTag()
        this.inputVideo(newMov)
    }

    let videoRatio = this.inputMov.videoWidth/this.inputMov.videoHeight
    if (document.fullscreenElement!=null) {  // To prevent float precision caused problem.
        if(!this.isFullscreen){
            console.log("Fullscreen detected.")
            this.resizeBoard(videoRatio, this.screenRatio)
            this.isFullscreen = true
        }
    } else {
        if(this.isFullscreen){
            console.log("Fullscreen deactivated.")
            // Reset all style.
            globalBoard.style.width = "100%"
            globalBoard.style.height = "100%"
            globalBoard.style.marginLeft = null
            globalBoard.style.marginTop = null
            // Then re-calculate board ratio.
            this.resizeBoard(videoRatio, this.playerRatio)
            this.isFullscreen = false
        }
    }

    // Check if video is paused.
    if (this.inputMov.paused){
        // If paused we stop rendering new frames.
        if(!this.isLoggedPaused){
            console.log("Video paused.")
            this.isLoggedPaused = true
        }
        return
    } else {
        // Else we continue rendering new frames.
        if(this.isLoggedPaused){
            console.log("Video continued.")
            this.isLoggedPaused = false
        }
    }

    if (this.inputMov) {
        updateTexture(gl, this.inputTex, this.inputMov);
    }

    // Automatic change scale according to original video resolution.
    // Upscaled to 1440p.
    let newScale = 1440 / this.inputMov.videoHeight;
    if (this.scale != newScale){
        this.scale = newScale;
        console.log('Setting scale to ' + this.scale);
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);


    // First upscaling with Bicubic interpolation.
    // Upscaling
    bindFramebuffer(gl, this.framebuffer, this.scaleTexture);

    gl.useProgram(scalePgm.program);

    bindAttribute(gl, this.quadBuffer, scalePgm.a_pos, 2);
    bindTexture(gl, this.inputTex, 0);
    gl.uniform1i(scalePgm.u_texture, 0);
    gl.uniform2f(scalePgm.u_size, this.inputWidth, this.inputHeight);

    gl.drawArrays(gl.TRIANGLES, 0, 6);


    // Scaled: scaleTexture

    // Thin Lines
    bindFramebuffer(gl, this.framebuffer, this.scaleTexture2);

    gl.useProgram(thinLinesPgm.program);

    bindAttribute(gl, this.quadBuffer, thinLinesPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture, 0);
    gl.uniform1i(thinLinesPgm.scaled_texture, 0);
    gl.uniform1f(thinLinesPgm.u_scale, this.scale);
    gl.uniform2f(thinLinesPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Scaled: scaleTexture2

    // Compute Luminance
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture);

    gl.useProgram(lumaPgm.program);

    bindAttribute(gl, this.quadBuffer, lumaPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    gl.uniform1i(lumaPgm.scaled_texture, 0);
    gl.uniform2f(lumaPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Scaled: scaleTexture2 (unchanged)
    // PostKernel: postKernelTexture (luminance)

    // Compute Luminance Gaussian X
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture2);

    gl.useProgram(lumaGausXPgm.program);

    bindAttribute(gl, this.quadBuffer, lumaGausXPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture, 1);
    gl.uniform1i(lumaGausXPgm.scaled_texture, 0);
    gl.uniform1i(lumaGausXPgm.post_kernel_texture, 1);
    gl.uniform2f(lumaGausXPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture2

    // Compute Luminance Gaussian Y
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture);

    gl.useProgram(lumaGausYPgm.program);

    bindAttribute(gl, this.quadBuffer, lumaGausYPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture2, 1);
    gl.uniform1i(lumaGausYPgm.scaled_texture, 0);
    gl.uniform1i(lumaGausYPgm.post_kernel_texture, 1);
    gl.uniform2f(lumaGausYPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture

    // Line detect
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture2);

    gl.useProgram(lineDetectPgm.program);

    bindAttribute(gl, this.quadBuffer, lumaGausYPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture, 1);
    gl.uniform1i(lineDetectPgm.scaled_texture, 0);
    gl.uniform1i(lineDetectPgm.post_kernel_texture, 1);
    gl.uniform2f(lineDetectPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture2

    // Compute Line Gaussian X
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture);

    gl.useProgram(lineGausXPgm.program);

    bindAttribute(gl, this.quadBuffer, lineGausXPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture2, 1);
    gl.uniform1i(lineGausXPgm.scaled_texture, 0);
    gl.uniform1i(lineGausXPgm.post_kernel_texture, 1);
    gl.uniform2f(lineGausXPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture

    // Compute Line Gaussian Y
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture2);

    gl.useProgram(lineGausYPgm.program);

    bindAttribute(gl, this.quadBuffer, lineGausYPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture, 1);
    gl.uniform1i(lineGausYPgm.scaled_texture, 0);
    gl.uniform1i(lineGausYPgm.post_kernel_texture, 1);
    gl.uniform2f(lineGausYPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture2

    // Compute Gradient
    bindFramebuffer(gl, this.framebuffer, this.postKernelTexture);

    gl.useProgram(gradPgm.program);

    bindAttribute(gl, this.quadBuffer, gradPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture2, 1);
    gl.uniform1i(gradPgm.scaleFrag, 0);
    gl.uniform1i(gradPgm.post_kernel_texture, 1);
    gl.uniform2f(gradPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: postKernelTexture

    // Refine
    bindFramebuffer(gl, this.framebuffer, this.scaleTexture);

    gl.useProgram(refinePgm.program);

    bindAttribute(gl, this.quadBuffer, refinePgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    bindTexture(gl, this.postKernelTexture, 1);
    gl.uniform1i(refinePgm.u_texture, 0);
    gl.uniform1i(refinePgm.u_textureTemp, 1);
    gl.uniform1f(refinePgm.u_scale, this.scale);
    gl.uniform2f(refinePgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: scaleTexture

    // FXAA
    bindFramebuffer(gl, this.framebuffer, this.scaleTexture2);

    gl.useProgram(fxaaPgm.program);

    bindAttribute(gl, this.quadBuffer, fxaaPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture, 0);
    bindTexture(gl, this.postKernelTexture, 1);
    gl.uniform1i(fxaaPgm.u_texture, 0);
    gl.uniform1i(fxaaPgm.u_textureTemp, 1);
    gl.uniform1f(fxaaPgm.u_scale, this.scale);
    gl.uniform2f(fxaaPgm.u_pt, 1.0 / gl.canvas.width, 1.0 / gl.canvas.height);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // PostKernel: scaleTexture2

    // Draw
    bindFramebuffer(gl, null);

    gl.useProgram(drawPgm.program);

    bindAttribute(gl, this.quadBuffer, drawPgm.a_pos, 2);
    bindTexture(gl, this.scaleTexture2, 0);
    gl.uniform1i(drawPgm.u_texture, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// Parameters.
let globalScaler = null;
let globalMovOrig = null;
let globalBoard = null;
let globalScale = 2.0;
let globalCurrentHref=window.location.href

let globalUpdateId, globalPreviousDelta = 0;
let globalFpsLimit = 30;    // Limit fps to 30 fps. Change here if you want more frames to be rendered. (But usually 30 fps is pretty enough for most anime as they are mostly done on threes.)

function getScreenRefreshRate(callback, runIndefinitely = false){
    let requestId = null;
    let callbackTriggered = false;
    runIndefinitely = runIndefinitely || false;

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame;
    }
    
    let DOMHighResTimeStampCollection = [];

    let triggerAnimation = function(DOMHighResTimeStamp){
        DOMHighResTimeStampCollection.unshift(DOMHighResTimeStamp);
        
        if (DOMHighResTimeStampCollection.length > 10) {
            let t0 = DOMHighResTimeStampCollection.pop();
            let fps = Math.floor(1000 * 10 / (DOMHighResTimeStamp - t0));

            if(!callbackTriggered){
                callback.call(undefined, fps, DOMHighResTimeStampCollection);
            }

            if(runIndefinitely){
                callbackTriggered = false;
            }else{
                callbackTriggered = true;
            }
        }
    
        requestId = window.requestAnimationFrame(triggerAnimation);
    };
    
    window.requestAnimationFrame(triggerAnimation);

    // Stop after half second if it shouldn't run indefinitely
    if(!runIndefinitely){
        window.setTimeout(function(){
            window.cancelAnimationFrame(requestId);
            requestId = null;
        }, 500);
    }
}

async function injectCanvas() {
    console.log('Injecting canvas...')

    // Create a canvas (since video tag do not support WebGL).
    globalMovOrig = await getVideoTag()

    let div = globalMovOrig.parentElement
    //while(div.className!="bilibili-player-video") {
    //    await new Promise(r => setTimeout(r, 500));
    //}
    div = globalMovOrig.parentElement
    div.style.backgroundColor = "black" // Patch for ACFun.

    console.log("globalBoard not exists. Creating new one.")

    globalBoard = document.createElement('canvas');
    // Make it visually fill the positioned parent
    globalBoard.style.width = '100%';
    globalBoard.style.height = '100%';
    // ...then set the internal size to match
    globalBoard.width = globalBoard.offsetWidth;
    globalBoard.height = globalBoard.offsetHeight;
    // Add it back to the div where contains the video tag we use as input.
    console.log("Adding new canvas.")
    div.appendChild(globalBoard)

    // Hide original video tag, we don't need it to be displayed.
    globalMovOrig.style.display = 'none'
}

async function getVideoTag() {
    while(document.getElementsByTagName("video").length <= 0) {
        await new Promise(r => setTimeout(r, 500));
    }
    
    globalMovOrig=document.getElementsByTagName("video")[0]
    
    globalMovOrig.addEventListener('loadedmetadata', function () {
        globalScaler = !globalScaler?new Scaler(globalBoard.getContext('webgl')):globalScaler;
        globalScaler.inputVideo(globalMovOrig);
        globalScaler.resize(globalScale);
        globalScaler.scale = globalScale;
    }, true);
    globalMovOrig.addEventListener('error', function () {
        alert("Can't get video, sorry.");
    }, true);

    return globalMovOrig
}

async function doFilter() {
    // Setting our parameters for filtering.
    // scale: multipliers that we need to zoom in.
    // Here's the fun part. We create a pixel shader for our canvas
    console.log('Enabling filter...')

    // Auto detect refresh rate.
    getScreenRefreshRate(function(screenRefreshRate){
        globalFpsLimit = Math.floor((screenRefreshRate+1) / 2);
        globalFpsLimit = globalFpsLimit<30?30:globalFpsLimit;   // If refresh rate is below 30 fps we round it up to 30.
        console.log("Framerate limit is set to " + globalFpsLimit + " FPS.");
    });

    // Do it! Filter it! Profit!
    async function render(currentDelta) {
        // Notice that limiting the framerate here did increase performance.
        globalUpdateId = requestAnimationFrame(render);
        let delta = currentDelta - globalPreviousDelta;

        if (globalFpsLimit && delta < 1000/globalFpsLimit){
            return;
        }

        if (globalScaler) {
            globalScaler.render();
        }

        if (globalCurrentHref!=window.location.href){
            console.log("Page changed!")
            await injectCanvas()
            globalCurrentHref=window.location.href
        }

        globalPreviousDelta = currentDelta
    }

    globalUpdateId = requestAnimationFrame(render);
}

setTimeout(function(){
    (async function () {
    console.log('Bilibili_Anime4K starting...')
    await injectCanvas()
    doFilter()
})();
}, 3000);
