// ==UserScript==
// @name                Bilibili_Anime4K_Experimental
// @name:zh-CN          Bilibili Anime4K滤镜(实验性)
// @description         Bring Anime4K to Bilibili and ACFun's HTML5 player to clearify 2D anime.
// @description:zh-CN   通过Anime4K滤镜让Bilibili和ACFun上的2D番剧更加清晰
// @namespace           http://net2cn.tk/
// @homepageURL         https://github.com/net2cn/Bilibili_Anime4K/
// @supportURL          https://github.com/net2cn/Bilibili_Anime4K/issues
// @version             0.5.2
// @author              net2cn
// @copyright           bloc97, DextroseRe, NeuroWhAI, and all contributors of Anime4K
// @include        http://*
// @include        https://*
// @grant               none
// @license             MIT License
// @run-at              document-idle
// ==/UserScript==

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

const frag0 = `
precision mediump float;

uniform sampler2D HOOKED;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float s_1;
  vec2 tmpvar_2;
  float tmpvar_3;
  tmpvar_3 = -(HOOKED_pt.x);
  tmpvar_2.x = tmpvar_3;
  float tmpvar_4;
  tmpvar_4 = -(HOOKED_pt.y);
  tmpvar_2.y = tmpvar_4;
  vec4 tmpvar_5;
  tmpvar_5 = texture2D (HOOKED, (v_tex_pos + tmpvar_2));
  vec2 tmpvar_6;
  tmpvar_6.y = 0.0;
  tmpvar_6.x = tmpvar_3;
  vec4 tmpvar_7;
  tmpvar_7 = texture2D (HOOKED, (v_tex_pos + tmpvar_6));
  vec2 tmpvar_8;
  tmpvar_8.x = tmpvar_3;
  tmpvar_8.y = HOOKED_pt.y;
  vec4 tmpvar_9;
  tmpvar_9 = texture2D (HOOKED, (v_tex_pos + tmpvar_8));
  vec2 tmpvar_10;
  tmpvar_10.x = 0.0;
  tmpvar_10.y = tmpvar_4;
  vec4 tmpvar_11;
  tmpvar_11 = texture2D (HOOKED, (v_tex_pos + tmpvar_10));
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (HOOKED, v_tex_pos);
  vec2 tmpvar_13;
  tmpvar_13.x = 0.0;
  tmpvar_13.y = HOOKED_pt.y;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (HOOKED, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = HOOKED_pt.x;
  tmpvar_15.y = tmpvar_4;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (HOOKED, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.y = 0.0;
  tmpvar_17.x = HOOKED_pt.x;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (HOOKED, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (HOOKED, (v_tex_pos + HOOKED_pt));

  uniform float Constvalue1 = 12.5;

  s_1 = (((
    ((((
      ((0.0619901 * tmpvar_5.x) + (-0.8700384 * tmpvar_7.x))
     + 
      (-0.03746179 * tmpvar_9.x)
    ) + (0.1317253 * tmpvar_11.x)) + (0.8758553 * tmpvar_12.x)) + (-0.1360945 * tmpvar_14.x))
   + 
    (-0.0701196 * tmpvar_16.x)
  ) + (-0.05113159 * tmpvar_18.x)) + (0.09209152 * tmpvar_19.x));
  float tmpvar_20;
  tmpvar_20 = (s_1 + -0.01729001);
  s_1 = (((
    ((((
      ((0.4526496 * tmpvar_5.x) + (-1.124027 * tmpvar_7.x))
     + 
      (0.07975403 * tmpvar_9.x)
    ) + (0.6734861 * tmpvar_11.x)) + (-0.05388544 * tmpvar_12.x)) + (0.007570164 * tmpvar_14.x))
   + 
    (-0.06987841 * tmpvar_16.x)
  ) + (0.01224736 * tmpvar_18.x)) + (0.03494999 * tmpvar_19.x));
  float tmpvar_21;
  tmpvar_21 = (s_1 + -0.01455003);
  s_1 = (((
    ((((
      ((-0.03565941 * tmpvar_5.x) + (0.04331381 * tmpvar_7.x))
     + 
      (-0.0565563 * tmpvar_9.x)
    ) + (0.08745333 * tmpvar_11.x)) + (0.6312519 * tmpvar_12.x)) + (-0.2450135 * tmpvar_14.x))
   + 
    (-0.1340796 * tmpvar_16.x)
  ) + (-0.1863449 * tmpvar_18.x)) + (-0.08149098 * tmpvar_19.x));
  vec4 tmpvar_22;
  tmpvar_22.x = (((
    ((((
      (((-0.09440448 * tmpvar_5.x) + (0.4912016 * tmpvar_7.x)) + (-0.022703 * tmpvar_9.x))
     + 
      (-0.01655326 * tmpvar_11.x)
    ) + (0.6272513 * tmpvar_12.x)) + (-0.9763271 * tmpvar_14.x)) + (0.1081558 * tmpvar_16.x))
   + 
    (-0.2189874 * tmpvar_18.x)
  ) + (0.09604159 * tmpvar_19.x)));
  tmpvar_22.y = tmpvar_20;
  tmpvar_22.z = tmpvar_21;
  tmpvar_22.w = (s_1 + -0.009025143);
  gl_FragColor = tmpvar_22;
}


`;

const frag1 = `
precision mediump float;

uniform sampler2D LUMAN0;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float z_1;
  float y_2;
  float x_3;
  float w_4;
  float v_5;
  float u_6;
  float t_7;
  float s_8;
  vec2 tmpvar_9;
  float tmpvar_10;
  tmpvar_10 = -(HOOKED_pt.x);
  tmpvar_9.x = tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(HOOKED_pt.y);
  tmpvar_9.y = tmpvar_11;
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (LUMAN0, (v_tex_pos + tmpvar_9));
  vec2 tmpvar_13;
  tmpvar_13.y = 0.0;
  tmpvar_13.x = tmpvar_10;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (LUMAN0, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = tmpvar_10;
  tmpvar_15.y = HOOKED_pt.y;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (LUMAN0, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.x = 0.0;
  tmpvar_17.y = tmpvar_11;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (LUMAN0, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (LUMAN0, v_tex_pos);
  vec2 tmpvar_20;
  tmpvar_20.x = 0.0;
  tmpvar_20.y = HOOKED_pt.y;
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (LUMAN0, (v_tex_pos + tmpvar_20));
  vec2 tmpvar_22;
  tmpvar_22.x = HOOKED_pt.x;
  tmpvar_22.y = tmpvar_11;
  vec4 tmpvar_23;
  tmpvar_23 = texture2D (LUMAN0, (v_tex_pos + tmpvar_22));
  vec2 tmpvar_24;
  tmpvar_24.y = 0.0;
  tmpvar_24.x = HOOKED_pt.x;
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (LUMAN0, (v_tex_pos + tmpvar_24));
  vec4 tmpvar_26;
  tmpvar_26 = texture2D (LUMAN0, (v_tex_pos + HOOKED_pt));
  vec4 tmpvar_27;
  tmpvar_27 = -(min (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_28;
  tmpvar_28 = -(min (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_29;
  tmpvar_29 = -(min (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_30;
  tmpvar_30 = -(min (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_31;
  tmpvar_31 = -(min (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_32;
  tmpvar_32 = -(min (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_33;
  tmpvar_33 = -(min (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_34;
  tmpvar_34 = -(min (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_35;
  tmpvar_35 = -(min (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_36;
  tmpvar_36 = max (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_37;
  tmpvar_37 = max (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_38;
  tmpvar_38 = max (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_39;
  tmpvar_39 = max (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_40;
  tmpvar_40 = max (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_41;
  tmpvar_41 = max (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_42;
  tmpvar_42 = max (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_43;
  tmpvar_43 = max (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_44;
  tmpvar_44 = max (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0));
  s_8 = (((
    ((((
      ((-0.107752 * tmpvar_36.x) + (-0.03133996 * tmpvar_37.x))
     + 
      (0.006064208 * tmpvar_38.x)
    ) + (-0.1054519 * tmpvar_39.x)) + (0.1245845 * tmpvar_40.x)) + (0.002123116 * tmpvar_41.x))
   + 
    (0.07905482 * tmpvar_42.x)
  ) + (0.08223747 * tmpvar_43.x)) + (0.04828753 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((0.1327148 * tmpvar_36.y) + (-0.4048563 * tmpvar_37.y))
     + 
      (0.05464118 * tmpvar_38.y)
    ) + (-0.4327063 * tmpvar_39.y)) + (-0.1954548 * tmpvar_40.y)) + (0.09262824 * tmpvar_41.y))
   + 
    (-0.3624773 * tmpvar_42.y)
  ) + (0.1262779 * tmpvar_43.y)) + (-0.07579274 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.09226349 * tmpvar_36.z) + (0.24326 * tmpvar_37.z))
     + 
      (-0.02135519 * tmpvar_38.z)
    ) + (0.1444612 * tmpvar_39.z)) + (-0.1025479 * tmpvar_40.z)) + (0.05568293 * tmpvar_41.z))
   + 
    (0.01387591 * tmpvar_42.z)
  ) + (0.1968805 * tmpvar_43.z)) + (0.01547643 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.1431215 * tmpvar_36.w) + (-0.2623357 * tmpvar_37.w))
     + 
      (-0.02062673 * tmpvar_38.w)
    ) + (0.01954003 * tmpvar_39.w)) + (0.1816429 * tmpvar_40.w)) + (-0.1635623 * tmpvar_41.w))
   + 
    (0.1701463 * tmpvar_42.w)
  ) + (-0.2778811 * tmpvar_43.w)) + (0.0718594 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.203483 * tmpvar_27.x) + (0.1099479 * tmpvar_28.x))
     + 
      (0.01499054 * tmpvar_29.x)
    ) + (1.033602 * tmpvar_30.x)) + (0.02453762 * tmpvar_31.x)) + (0.009609228 * tmpvar_32.x))
   + 
    (0.1277962 * tmpvar_33.x)
  ) + (0.06813842 * tmpvar_34.x)) + (-0.04269685 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.2430749 * tmpvar_27.y) + (0.3746666 * tmpvar_28.y))
     + 
      (-0.06150604 * tmpvar_29.y)
    ) + (0.2820409 * tmpvar_30.y)) + (0.2222655 * tmpvar_31.y)) + (-0.1971546 * tmpvar_32.y))
   + 
    (0.003657579 * tmpvar_33.y)
  ) + (-0.303636 * tmpvar_34.y)) + (0.0542432 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.1447509 * tmpvar_27.z) + (-0.2865091 * tmpvar_28.z))
     + 
      (-0.05872395 * tmpvar_29.z)
    ) + (-0.09287924 * tmpvar_30.z)) + (0.2642857 * tmpvar_31.z)) + (-0.1047491 * tmpvar_32.z))
   + 
    (-0.0700947 * tmpvar_33.z)
  ) + (0.04757173 * tmpvar_34.z)) + (-0.01006137 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.0438258 * tmpvar_27.w) + (0.3403145 * tmpvar_28.w))
     + 
      (-0.01360015 * tmpvar_29.w)
    ) + (0.2825096 * tmpvar_30.w)) + (-0.735916 * tmpvar_31.w)) + (0.2124108 * tmpvar_32.w))
   + 
    (-0.2754275 * tmpvar_33.w)
  ) + (0.1402342 * tmpvar_34.w)) + (-0.1067815 * tmpvar_35.w));
  float tmpvar_45;
  tmpvar_45 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.02150236)));
  s_8 = (((
    ((((
      ((0.03216388 * tmpvar_36.x) + (-0.6664289 * tmpvar_37.x))
     + 
      (0.0447512 * tmpvar_38.x)
    ) + (0.05605561 * tmpvar_39.x)) + (0.6945027 * tmpvar_40.x)) + (-0.07645503 * tmpvar_41.x))
   + 
    (-0.04662916 * tmpvar_42.x)
  ) + (-0.2509118 * tmpvar_43.x)) + (0.09892318 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((0.03268785 * tmpvar_36.y) + (0.2343848 * tmpvar_37.y))
     + 
      (-0.05890758 * tmpvar_38.y)
    ) + (-0.6397386 * tmpvar_39.y)) + (-0.1512144 * tmpvar_40.y)) + (0.153548 * tmpvar_41.y))
   + 
    (-0.3191564 * tmpvar_42.y)
  ) + (-0.2413832 * tmpvar_43.y)) + (-0.7151675 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.06960297 * tmpvar_36.z) + (-0.4111596 * tmpvar_37.z))
     + 
      (0.02171825 * tmpvar_38.z)
    ) + (0.2399502 * tmpvar_39.z)) + (0.6426321 * tmpvar_40.z)) + (0.3311527 * tmpvar_41.z))
   + 
    (-0.2513218 * tmpvar_42.z)
  ) + (-0.4800404 * tmpvar_43.z)) + (0.7807 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.6631432 * tmpvar_36.w) + (0.1536025 * tmpvar_37.w))
     + 
      (0.01244981 * tmpvar_38.w)
    ) + (-0.9210798 * tmpvar_39.w)) + (0.7706335 * tmpvar_40.w)) + (0.1040289 * tmpvar_41.w))
   + 
    (0.267286 * tmpvar_42.w)
  ) + (-0.3063174 * tmpvar_43.w)) + (0.07107563 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.2291002 * tmpvar_27.x) + (0.6066831 * tmpvar_28.x))
     + 
      (-0.07472177 * tmpvar_29.x)
    ) + (-0.2976557 * tmpvar_30.x)) + (-0.3117921 * tmpvar_31.x)) + (0.1797921 * tmpvar_32.x))
   + 
    (-0.05997368 * tmpvar_33.x)
  ) + (0.4826206 * tmpvar_34.x)) + (0.1001232 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.008694405 * tmpvar_27.y) + (-0.1981287 * tmpvar_28.y))
     + 
      (0.02491685 * tmpvar_29.y)
    ) + (0.5773014 * tmpvar_30.y)) + (0.2050515 * tmpvar_31.y)) + (-0.2229741 * tmpvar_32.y))
   + 
    (0.09352177 * tmpvar_33.y)
  ) + (-0.548608 * tmpvar_34.y)) + (0.5603251 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.05522713 * tmpvar_27.z) + (0.3843459 * tmpvar_28.z))
     + 
      (-0.01795268 * tmpvar_29.z)
    ) + (-0.2495861 * tmpvar_30.z)) + (-0.641729 * tmpvar_31.z)) + (-0.1384299 * tmpvar_32.z))
   + 
    (0.2048626 * tmpvar_33.z)
  ) + (0.2405851 * tmpvar_34.z)) + (-0.5355328 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.7243502 * tmpvar_27.w) + (-0.168804 * tmpvar_28.w))
     + 
      (0.1134703 * tmpvar_29.w)
    ) + (0.9873083 * tmpvar_30.w)) + (-0.4131502 * tmpvar_31.w)) + (-0.605653 * tmpvar_32.w))
   + 
    (-0.2023195 * tmpvar_33.w)
  ) + (0.268739 * tmpvar_34.w)) + (-0.2549402 * tmpvar_35.w));
  float tmpvar_46;
  tmpvar_46 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.01137513)));
  s_8 = (((
    ((((
      ((0.004939782 * tmpvar_36.x) + (0.04961287 * tmpvar_37.x))
     + 
      (-0.02231506 * tmpvar_38.x)
    ) + (-0.3672146 * tmpvar_39.x)) + (0.02673542 * tmpvar_40.x)) + (-0.05512777 * tmpvar_41.x))
   + 
    (-0.3139398 * tmpvar_42.x)
  ) + (0.01117737 * tmpvar_43.x)) + (-0.002486109 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((0.002913916 * tmpvar_36.y) + (-0.01827969 * tmpvar_37.y))
     + 
      (0.2385065 * tmpvar_38.y)
    ) + (-0.05342757 * tmpvar_39.y)) + (-0.1938836 * tmpvar_40.y)) + (0.2514952 * tmpvar_41.y))
   + 
    (-0.1596906 * tmpvar_42.y)
  ) + (0.003607878 * tmpvar_43.y)) + (0.4786477 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.01858786 * tmpvar_36.z) + (0.04256821 * tmpvar_37.z))
     + 
      (-0.08488905 * tmpvar_38.z)
    ) + (-0.1064968 * tmpvar_39.z)) + (0.1413508 * tmpvar_40.z)) + (-0.01486306 * tmpvar_41.z))
   + 
    (0.04607239 * tmpvar_42.z)
  ) + (0.04470599 * tmpvar_43.z)) + (-0.3495728 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.2595261 * tmpvar_36.w) + (-0.3713867 * tmpvar_37.w))
     + 
      (-0.3176968 * tmpvar_38.w)
    ) + (-0.4708613 * tmpvar_39.w)) + (0.4518305 * tmpvar_40.w)) + (0.2390676 * tmpvar_41.w))
   + 
    (0.3778549 * tmpvar_42.w)
  ) + (-0.123422 * tmpvar_43.w)) + (-0.1895852 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.0987012 * tmpvar_27.x) + (-0.2368059 * tmpvar_28.x))
     + 
      (-0.03812888 * tmpvar_29.x)
    ) + (0.02100395 * tmpvar_30.x)) + (-0.2127996 * tmpvar_31.x)) + (0.02450331 * tmpvar_32.x))
   + 
    (0.2250868 * tmpvar_33.x)
  ) + (-0.05061998 * tmpvar_34.x)) + (-0.1292934 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.02445845 * tmpvar_27.y) + (0.07273773 * tmpvar_28.y))
     + 
      (-0.2604895 * tmpvar_29.y)
    ) + (0.184602 * tmpvar_30.y)) + (0.4304707 * tmpvar_31.y)) + (-0.1727288 * tmpvar_32.y))
   + 
    (0.2835147 * tmpvar_33.y)
  ) + (1.311608 * tmpvar_34.y)) + (-0.2954052 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.04109441 * tmpvar_27.z) + (0.02471945 * tmpvar_28.z))
     + 
      (0.1989679 * tmpvar_29.z)
    ) + (0.07664201 * tmpvar_30.z)) + (-0.256212 * tmpvar_31.z)) + (0.1074933 * tmpvar_32.z))
   + 
    (-0.06718259 * tmpvar_33.z)
  ) + (0.06065049 * tmpvar_34.z)) + (0.4707401 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.1351835 * tmpvar_27.w) + (0.2048883 * tmpvar_28.w))
     + 
      (0.2495609 * tmpvar_29.w)
    ) + (0.07386013 * tmpvar_30.w)) + (-0.9938687 * tmpvar_31.w)) + (-0.1537565 * tmpvar_32.w))
   + 
    (-0.5580471 * tmpvar_33.w)
  ) + (-0.003611487 * tmpvar_34.w)) + (0.3378182 * tmpvar_35.w));
  vec4 tmpvar_47;
  tmpvar_47.x = (((
    ((((
      ((((
        ((((
          ((-0.05327107 * tmpvar_36.x) + (-0.07160779 * tmpvar_37.x))
         + 
          (-0.0535452 * tmpvar_38.x)
        ) + (0.3065365 * tmpvar_39.x)) + (-0.623205 * tmpvar_40.x)) + (-0.2513593 * tmpvar_41.x))
       + 
        (-0.1804631 * tmpvar_42.x)
      ) + (0.5326353 * tmpvar_43.x)) + (-0.09099461 * tmpvar_44.x)) + (((
        ((((
          ((-0.166873 * tmpvar_36.y) + (0.293837 * tmpvar_37.y))
         + 
          (-0.1511653 * tmpvar_38.y)
        ) + (0.01343578 * tmpvar_39.y)) + (-0.3595954 * tmpvar_40.y)) + (0.3222953 * tmpvar_41.y))
       + 
        (0.201271 * tmpvar_42.y)
      ) + (1.150402 * tmpvar_43.y)) + (0.6521217 * tmpvar_44.y)))
     + 
      ((((
        ((((
          (-0.00156498 * tmpvar_36.z)
         + 
          (-0.1881486 * tmpvar_37.z)
        ) + (0.0616953 * tmpvar_38.z)) + (0.01380649 * tmpvar_39.z)) + (0.127457 * tmpvar_40.z))
       + 
        (-0.3040643 * tmpvar_41.z)
      ) + (-0.05947408 * tmpvar_42.z)) + (0.3314193 * tmpvar_43.z)) + (-0.2006634 * tmpvar_44.z))
    ) + (
      ((((
        ((((0.3009532 * tmpvar_36.w) + (0.3658606 * tmpvar_37.w)) + (0.2264504 * tmpvar_38.w)) + (0.1612967 * tmpvar_39.w))
       + 
        (-0.3783404 * tmpvar_40.w)
      ) + (-0.08229078 * tmpvar_41.w)) + (-0.648279 * tmpvar_42.w)) + (0.04798959 * tmpvar_43.w))
     + 
      (0.5042697 * tmpvar_44.w)
    )) + ((
      ((((
        (((0.126555 * tmpvar_27.x) + (0.07900497 * tmpvar_28.x)) + (-0.06367056 * tmpvar_29.x))
       + 
        (-0.1654697 * tmpvar_30.x)
      ) + (0.5079547 * tmpvar_31.x)) + (0.1801183 * tmpvar_32.x)) + (0.1699631 * tmpvar_33.x))
     + 
      (-0.51605 * tmpvar_34.x)
    ) + (0.1050529 * tmpvar_35.x))) + (((
      ((((
        ((0.1540833 * tmpvar_27.y) + (-0.2691321 * tmpvar_28.y))
       + 
        (0.1360581 * tmpvar_29.y)
      ) + (-0.1215572 * tmpvar_30.y)) + (0.2140506 * tmpvar_31.y)) + (-0.2797294 * tmpvar_32.y))
     + 
      (-0.4138207 * tmpvar_33.y)
    ) + (-1.722414 * tmpvar_34.y)) + (-0.6029438 * tmpvar_35.y)))
   + 
    ((((
      ((((
        (0.00970452 * tmpvar_27.z)
       + 
        (0.2032586 * tmpvar_28.z)
      ) + (0.001574583 * tmpvar_29.z)) + (-0.107313 * tmpvar_30.z)) + (0.009980262 * tmpvar_31.z))
     + 
      (0.2720558 * tmpvar_32.z)
    ) + (0.1532188 * tmpvar_33.z)) + (-0.03678197 * tmpvar_34.z)) + (0.05122958 * tmpvar_35.z))
  ) + (
    ((((
      ((((-0.2745487 * tmpvar_27.w) + (-0.4432009 * tmpvar_28.w)) + (-0.003881375 * tmpvar_29.w)) + (0.1833615 * tmpvar_30.w))
     + 
      (0.1995093 * tmpvar_31.w)
    ) + (0.04501414 * tmpvar_32.w)) + (0.6243142 * tmpvar_33.w)) + (-0.1625224 * tmpvar_34.w))
   + 
    (-0.4227441 * tmpvar_35.w)
  )) + 0.0394235);
  tmpvar_47.y = tmpvar_45;
  tmpvar_47.z = tmpvar_46;
  tmpvar_47.w = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.04719993)));
  gl_FragColor = tmpvar_47;
}
`;

const frag2 = `
precision mediump float;

uniform sampler2D LUMAN1;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float z_1;
  float y_2;
  float x_3;
  float w_4;
  float v_5;
  float u_6;
  float t_7;
  float s_8;
  vec2 tmpvar_9;
  float tmpvar_10;
  tmpvar_10 = -(HOOKED_pt.x);
  tmpvar_9.x = tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(HOOKED_pt.y);
  tmpvar_9.y = tmpvar_11;
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (LUMAN1, (v_tex_pos + tmpvar_9));
  vec2 tmpvar_13;
  tmpvar_13.y = 0.0;
  tmpvar_13.x = tmpvar_10;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (LUMAN1, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = tmpvar_10;
  tmpvar_15.y = HOOKED_pt.y;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (LUMAN1, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.x = 0.0;
  tmpvar_17.y = tmpvar_11;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (LUMAN1, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (LUMAN1, v_tex_pos);
  vec2 tmpvar_20;
  tmpvar_20.x = 0.0;
  tmpvar_20.y = HOOKED_pt.y;
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (LUMAN1, (v_tex_pos + tmpvar_20));
  vec2 tmpvar_22;
  tmpvar_22.x = HOOKED_pt.x;
  tmpvar_22.y = tmpvar_11;
  vec4 tmpvar_23;
  tmpvar_23 = texture2D (LUMAN1, (v_tex_pos + tmpvar_22));
  vec2 tmpvar_24;
  tmpvar_24.y = 0.0;
  tmpvar_24.x = HOOKED_pt.x;
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (LUMAN1, (v_tex_pos + tmpvar_24));
  vec4 tmpvar_26;
  tmpvar_26 = texture2D (LUMAN1, (v_tex_pos + HOOKED_pt));
  vec4 tmpvar_27;
  tmpvar_27 = -(min (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_28;
  tmpvar_28 = -(min (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_29;
  tmpvar_29 = -(min (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_30;
  tmpvar_30 = -(min (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_31;
  tmpvar_31 = -(min (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_32;
  tmpvar_32 = -(min (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_33;
  tmpvar_33 = -(min (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_34;
  tmpvar_34 = -(min (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_35;
  tmpvar_35 = -(min (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_36;
  tmpvar_36 = max (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_37;
  tmpvar_37 = max (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_38;
  tmpvar_38 = max (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_39;
  tmpvar_39 = max (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_40;
  tmpvar_40 = max (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_41;
  tmpvar_41 = max (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_42;
  tmpvar_42 = max (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_43;
  tmpvar_43 = max (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_44;
  tmpvar_44 = max (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0));
  s_8 = (((
    ((((
      ((0.1504275 * tmpvar_36.x) + (0.7657861 * tmpvar_37.x))
     + 
      (0.159169 * tmpvar_38.x)
    ) + (0.06203889 * tmpvar_39.x)) + (0.900412 * tmpvar_40.x)) + (0.4482997 * tmpvar_41.x))
   + 
    (-0.1525204 * tmpvar_42.x)
  ) + (-0.0769386 * tmpvar_43.x)) + (-0.01720861 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.2495617 * tmpvar_36.y) + (-0.4890138 * tmpvar_37.y))
     + 
      (-0.5667875 * tmpvar_38.y)
    ) + (-0.04361386 * tmpvar_39.y)) + (-1.268301 * tmpvar_40.y)) + (0.4987458 * tmpvar_41.y))
   + 
    (-0.02351126 * tmpvar_42.y)
  ) + (-0.4496338 * tmpvar_43.y)) + (-0.447843 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.4755887 * tmpvar_36.z) + (0.5499969 * tmpvar_37.z))
     + 
      (-0.4080684 * tmpvar_38.z)
    ) + (0.1843827 * tmpvar_39.z)) + (-0.2484835 * tmpvar_40.z)) + (-0.6397795 * tmpvar_41.z))
   + 
    (-0.2635926 * tmpvar_42.z)
  ) + (0.481887 * tmpvar_43.z)) + (0.4296102 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.4294817 * tmpvar_36.w) + (0.4796334 * tmpvar_37.w))
     + 
      (0.2660744 * tmpvar_38.w)
    ) + (0.009006623 * tmpvar_39.w)) + (-0.202493 * tmpvar_40.w)) + (0.3191499 * tmpvar_41.w))
   + 
    (-0.009933394 * tmpvar_42.w)
  ) + (0.0220853 * tmpvar_43.w)) + (-0.05937115 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.3907101 * tmpvar_27.x) + (0.9670712 * tmpvar_28.x))
     + 
      (0.5870382 * tmpvar_29.x)
    ) + (-1 * tmpvar_30.x)) + (-0.6050112 * tmpvar_31.x)) + (-0.2620521 * tmpvar_32.x))
   + 
    (0.002280391 * tmpvar_33.x)
  ) + (0.199146 * tmpvar_34.x)) + (-0.007532746 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.6501524 * tmpvar_27.y) + (-0.6191325 * tmpvar_28.y))
     + 
      (0.03358498 * tmpvar_29.y)
    ) + (-0.2379236 * tmpvar_30.y)) + (0.2844354 * tmpvar_31.y)) + (0.7995467 * tmpvar_32.y))
   + 
    (0.6144392 * tmpvar_33.y)
  ) + (-0.2151685 * tmpvar_34.y)) + (-0.642132 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.02893317 * tmpvar_27.z) + (-0.8038524 * tmpvar_28.z))
     + 
      (-0.8938459 * tmpvar_29.z)
    ) + (-0.5202012 * tmpvar_30.z)) + (0.2658711 * tmpvar_31.z)) + (-0.9662124 * tmpvar_32.z))
   + 
    (0.1666937 * tmpvar_33.z)
  ) + (0 * tmpvar_34.z)) + (-0.1563227 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.04982121 * tmpvar_27.w) + (0.3209018 * tmpvar_28.w))
     + 
      (-0.188282 * tmpvar_29.w)
    ) + (0.09291354 * tmpvar_30.w)) + (-0.1704659 * tmpvar_31.w)) + (-0.3456725 * tmpvar_32.w))
   + 
    (-0.3083952 * tmpvar_33.w)
  ) + (0.1058506 * tmpvar_34.w)) + (0.2180293 * tmpvar_35.w));
  float tmpvar_45;
  tmpvar_45 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.03878304)));
  s_8 = (((
    ((((
      ((-0.008653712 * tmpvar_36.x) + (0.2927427 * tmpvar_37.x))
     + 
      (-0.1429917 * tmpvar_38.x)
    ) + (0.2435591 * tmpvar_39.x)) + (0.4415831 * tmpvar_40.x)) + (0.3856316 * tmpvar_41.x))
   + 
    (0.1826302 * tmpvar_42.x)
  ) + (0.0468175 * tmpvar_43.x)) + (0.08368182 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.003003128 * tmpvar_36.y) + (-0.2576694 * tmpvar_37.y))
     + 
      (-0.1668468 * tmpvar_38.y)
    ) + (-0.07155021 * tmpvar_39.y)) + (0.497516 * tmpvar_40.y)) + (0.5199395 * tmpvar_41.y))
   + 
    (-0.05572384 * tmpvar_42.y)
  ) + (-0.2015206 * tmpvar_43.y)) + (-0.3310546 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.1936008 * tmpvar_36.z) + (0.2909271 * tmpvar_37.z))
     + 
      (-0.1431309 * tmpvar_38.z)
    ) + (-0.1221905 * tmpvar_39.z)) + (0.3336699 * tmpvar_40.z)) + (0.198002 * tmpvar_41.z))
   + 
    (0.1287346 * tmpvar_42.z)
  ) + (0.1616214 * tmpvar_43.z)) + (0.05346552 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.1221446 * tmpvar_36.w) + (-0.3218724 * tmpvar_37.w))
     + 
      (-0.4942458 * tmpvar_38.w)
    ) + (0.04790124 * tmpvar_39.w)) + (0.1315279 * tmpvar_40.w)) + (0.2573084 * tmpvar_41.w))
   + 
    (-0.03230636 * tmpvar_42.w)
  ) + (-0.3537164 * tmpvar_43.w)) + (-0.1651416 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.06874291 * tmpvar_27.x) + (-0.1951285 * tmpvar_28.x))
     + 
      (0.4657543 * tmpvar_29.x)
    ) + (-0.03191416 * tmpvar_30.x)) + (0.3740557 * tmpvar_31.x)) + (0.152396 * tmpvar_32.x))
   + 
    (-0.023567 * tmpvar_33.x)
  ) + (0.3118303 * tmpvar_34.x)) + (0.0394527 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.07513823 * tmpvar_27.y) + (0.04187264 * tmpvar_28.y))
     + 
      (0.3561053 * tmpvar_29.y)
    ) + (-0.1445567 * tmpvar_30.y)) + (-1.024163 * tmpvar_31.y)) + (-0.6282327 * tmpvar_32.y))
   + 
    (0.06843732 * tmpvar_33.y)
  ) + (0.009273292 * tmpvar_34.y)) + (-0.2350089 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.1086413 * tmpvar_27.z) + (-0.2595082 * tmpvar_28.z))
     + 
      (-0.2728684 * tmpvar_29.z)
    ) + (-0.0922535 * tmpvar_30.z)) + (-0.4919539 * tmpvar_31.z)) + (-0.9883521 * tmpvar_32.z))
   + 
    (-0.1637848 * tmpvar_33.z)
  ) + (-0.4427558 * tmpvar_34.z)) + (-0.1925998 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.07329517 * tmpvar_27.w) + (0.7391222 * tmpvar_28.w))
     + 
      (-0.2792282 * tmpvar_29.w)
    ) + (-0.1989288 * tmpvar_30.w)) + (-0.02916587 * tmpvar_31.w)) + (-0.6447538 * tmpvar_32.w))
   + 
    (-0.1735304 * tmpvar_33.w)
  ) + (0.03036093 * tmpvar_34.w)) + (0.02361184 * tmpvar_35.w));
  float tmpvar_46;
  tmpvar_46 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + 0.005980591)));
  s_8 = (((
    ((((
      ((0.0520063 * tmpvar_36.x) + (0.3209907 * tmpvar_37.x))
     + 
      (0.1009653 * tmpvar_38.x)
    ) + (-0.3286558 * tmpvar_39.x)) + (0.2178226 * tmpvar_40.x)) + (-0.1672657 * tmpvar_41.x))
   + 
    (-0.006150555 * tmpvar_42.x)
  ) + (-0.006116407 * tmpvar_43.x)) + (0.04923024 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.003432869 * tmpvar_36.y) + (-0.09381717 * tmpvar_37.y))
     + 
      (-0.162349 * tmpvar_38.y)
    ) + (0.07074089 * tmpvar_39.y)) + (0.09283234 * tmpvar_40.y)) + (-0.5086407 * tmpvar_41.y))
   + 
    (0.1403347 * tmpvar_42.y)
  ) + (0.2656622 * tmpvar_43.y)) + (-0.06981026 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.003694442 * tmpvar_36.z) + (-0.1257419 * tmpvar_37.z))
     + 
      (-0.05118089 * tmpvar_38.z)
    ) + (-0.5780267 * tmpvar_39.z)) + (0.7782018 * tmpvar_40.z)) + (-0.5045395 * tmpvar_41.z))
   + 
    (0.02046464 * tmpvar_42.z)
  ) + (0.03623201 * tmpvar_43.z)) + (0.07828021 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.1449102 * tmpvar_36.w) + (-0.08246158 * tmpvar_37.w))
     + 
      (0.004828443 * tmpvar_38.w)
    ) + (-0.4167958 * tmpvar_39.w)) + (-0.371856 * tmpvar_40.w)) + (-0.5086088 * tmpvar_41.w))
   + 
    (-0.1011414 * tmpvar_42.w)
  ) + (0.02178261 * tmpvar_43.w)) + (0.02444324 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.09724159 * tmpvar_27.x) + (-0.1391396 * tmpvar_28.x))
     + 
      (0.1318808 * tmpvar_29.x)
    ) + (0.4496926 * tmpvar_30.x)) + (-0.2343041 * tmpvar_31.x)) + (0.3055466 * tmpvar_32.x))
   + 
    (0.1085249 * tmpvar_33.x)
  ) + (0.09672956 * tmpvar_34.x)) + (0.06470584 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.2209262 * tmpvar_27.y) + (-0.1703434 * tmpvar_28.y))
     + 
      (-0.4686587 * tmpvar_29.y)
    ) + (-0.1663838 * tmpvar_30.y)) + (-0.3681773 * tmpvar_31.y)) + (2.812608 * tmpvar_32.y))
   + 
    (0.2013668 * tmpvar_33.y)
  ) + (-0.02815549 * tmpvar_34.y)) + (-0.6738389 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.08178478 * tmpvar_27.z) + (-0.1310432 * tmpvar_28.z))
     + 
      (-0.003121543 * tmpvar_29.z)
    ) + (0.2549275 * tmpvar_30.z)) + (-0.6011733 * tmpvar_31.z)) + (1.270556 * tmpvar_32.z))
   + 
    (-0.05331229 * tmpvar_33.z)
  ) + (0.04038377 * tmpvar_34.z)) + (-0.2116879 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.2610418 * tmpvar_27.w) + (0.2443108 * tmpvar_28.w))
     + 
      (0.449256 * tmpvar_29.w)
    ) + (0.2364616 * tmpvar_30.w)) + (0.4555552 * tmpvar_31.w)) + (0.9546111 * tmpvar_32.w))
   + 
    (-0.2448516 * tmpvar_33.w)
  ) + (-0.1365885 * tmpvar_34.w)) + (0.03320505 * tmpvar_35.w));
  vec4 tmpvar_47;
  tmpvar_47.x = (((
    ((((
      ((((
        ((((
          ((0.06256399 * tmpvar_36.x) + (0.7022818 * tmpvar_37.x))
         + 
          (-0.01181056 * tmpvar_38.x)
        ) + (0.2527794 * tmpvar_39.x)) + (-0.2097257 * tmpvar_40.x)) + (0.1723318 * tmpvar_41.x))
       + 
        (-0.2860923 * tmpvar_42.x)
      ) + (-0.3295735 * tmpvar_43.x)) + (-0.1109141 * tmpvar_44.x)) + (((
        ((((
          ((0.007429022 * tmpvar_36.y) + (0.2570743 * tmpvar_37.y))
         + 
          (0.02356039 * tmpvar_38.y)
        ) + (-0.003331168 * tmpvar_39.y)) + (0.7879685 * tmpvar_40.y)) + (-0.8613285 * tmpvar_41.y))
       + 
        (0.0204314 * tmpvar_42.y)
      ) + (-0.01499378 * tmpvar_43.y)) + (-0.5224642 * tmpvar_44.y)))
     + 
      ((((
        ((((
          (-0.09931801 * tmpvar_36.z)
         + 
          (0.09669229 * tmpvar_37.z)
        ) + (-0.08122554 * tmpvar_38.z)) + (0.4837614 * tmpvar_39.z)) + (0.4021501 * tmpvar_40.z))
       + 
        (0.06631713 * tmpvar_41.z)
      ) + (-0.2829839 * tmpvar_42.z)) + (-0.1569044 * tmpvar_43.z)) + (-0.1172215 * tmpvar_44.z))
    ) + (
      ((((
        ((((-0.2010471 * tmpvar_36.w) + (0.2977343 * tmpvar_37.w)) + (-0.05952468 * tmpvar_38.w)) + (0.672484 * tmpvar_39.w))
       + 
        (0.5885094 * tmpvar_40.w)
      ) + (0.1908858 * tmpvar_41.w)) + (0.08556072 * tmpvar_42.w)) + (-0.3429526 * tmpvar_43.w))
     + 
      (-0.01970963 * tmpvar_44.w)
    )) + ((
      ((((
        (((0.2530852 * tmpvar_27.x) + (-0.2620652 * tmpvar_28.x)) + (-0.008751702 * tmpvar_29.x))
       + 
        (-0.3381546 * tmpvar_30.x)
      ) + (-0.00843703 * tmpvar_31.x)) + (-0.2292791 * tmpvar_32.x)) + (-0.06288648 * tmpvar_33.x))
     + 
      (0.1752455 * tmpvar_34.x)
    ) + (-0.008373106 * tmpvar_35.x))) + (((
      ((((
        ((0.1774159 * tmpvar_27.y) + (-0.5278811 * tmpvar_28.y))
       + 
        (-0.1098484 * tmpvar_29.y)
      ) + (-0.1367872 * tmpvar_30.y)) + (-0.2861895 * tmpvar_31.y)) + (0.1595905 * tmpvar_32.y))
     + 
      (-0.04411071 * tmpvar_33.y)
    ) + (-0.3234863 * tmpvar_34.y)) + (0.4967709 * tmpvar_35.y)))
   + 
    ((((
      ((((
        (0.04234744 * tmpvar_27.z)
       + 
        (0.08541207 * tmpvar_28.z)
      ) + (-0.1585716 * tmpvar_29.z)) + (-0.3090278 * tmpvar_30.z)) + (-0.8957161 * tmpvar_31.z))
     + 
      (-0.2927681 * tmpvar_32.z)
    ) + (0.4705302 * tmpvar_33.z)) + (0.6092259 * tmpvar_34.z)) + (0.3162334 * tmpvar_35.z))
  ) + (
    ((((
      ((((0.1796391 * tmpvar_27.w) + (-0.3082158 * tmpvar_28.w)) + (0.1531694 * tmpvar_29.w)) + (-0.3712572 * tmpvar_30.w))
     + 
      (-0.5975526 * tmpvar_31.w)
    ) + (-0.07182377 * tmpvar_32.w)) + (0.06945129 * tmpvar_33.w)) + (0.6175064 * tmpvar_34.w))
   + 
    (0.07411387 * tmpvar_35.w)
  )) + 0.02528243);
  tmpvar_47.y = tmpvar_45;
  tmpvar_47.z = tmpvar_46;
  tmpvar_47.w = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.03994689)));
  gl_FragColor = tmpvar_47;
}


`;

const frag3 = `
precision mediump float;

uniform sampler2D LUMAN2;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float z_1;
  float y_2;
  float x_3;
  float w_4;
  float v_5;
  float u_6;
  float t_7;
  float s_8;
  vec2 tmpvar_9;
  float tmpvar_10;
  tmpvar_10 = -(HOOKED_pt.x);
  tmpvar_9.x = tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(HOOKED_pt.y);
  tmpvar_9.y = tmpvar_11;
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (LUMAN2, (v_tex_pos + tmpvar_9));
  vec2 tmpvar_13;
  tmpvar_13.y = 0.0;
  tmpvar_13.x = tmpvar_10;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (LUMAN2, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = tmpvar_10;
  tmpvar_15.y = HOOKED_pt.y;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (LUMAN2, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.x = 0.0;
  tmpvar_17.y = tmpvar_11;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (LUMAN2, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (LUMAN2, v_tex_pos);
  vec2 tmpvar_20;
  tmpvar_20.x = 0.0;
  tmpvar_20.y = HOOKED_pt.y;
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (LUMAN2, (v_tex_pos + tmpvar_20));
  vec2 tmpvar_22;
  tmpvar_22.x = HOOKED_pt.x;
  tmpvar_22.y = tmpvar_11;
  vec4 tmpvar_23;
  tmpvar_23 = texture2D (LUMAN2, (v_tex_pos + tmpvar_22));
  vec2 tmpvar_24;
  tmpvar_24.y = 0.0;
  tmpvar_24.x = HOOKED_pt.x;
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (LUMAN2, (v_tex_pos + tmpvar_24));
  vec4 tmpvar_26;
  tmpvar_26 = texture2D (LUMAN2, (v_tex_pos + HOOKED_pt));
  vec4 tmpvar_27;
  tmpvar_27 = -(min (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_28;
  tmpvar_28 = -(min (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_29;
  tmpvar_29 = -(min (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_30;
  tmpvar_30 = -(min (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_31;
  tmpvar_31 = -(min (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_32;
  tmpvar_32 = -(min (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_33;
  tmpvar_33 = -(min (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_34;
  tmpvar_34 = -(min (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_35;
  tmpvar_35 = -(min (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_36;
  tmpvar_36 = max (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_37;
  tmpvar_37 = max (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_38;
  tmpvar_38 = max (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_39;
  tmpvar_39 = max (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_40;
  tmpvar_40 = max (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_41;
  tmpvar_41 = max (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_42;
  tmpvar_42 = max (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_43;
  tmpvar_43 = max (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_44;
  tmpvar_44 = max (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0));
  s_8 = (((
    ((((
      ((0.01888125 * tmpvar_36.x) + (0.06384664 * tmpvar_37.x))
     + 
      (-0.01176448 * tmpvar_38.x)
    ) + (0.1550135 * tmpvar_39.x)) + (-0.2185426 * tmpvar_40.x)) + (-0.07557788 * tmpvar_41.x))
   + 
    (0.0259386 * tmpvar_42.x)
  ) + (-0.144965 * tmpvar_43.x)) + (0.02489171 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.01996556 * tmpvar_36.y) + (-1 * tmpvar_37.y))
     + 
      (0 * tmpvar_38.y)
    ) + (0.02442967 * tmpvar_39.y)) + (0.05461711 * tmpvar_40.y)) + (-0.0218676 * tmpvar_41.y))
   + 
    (0.03206066 * tmpvar_42.y)
  ) + (0.003143334 * tmpvar_43.y)) + (-0.012302 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.07077833 * tmpvar_36.z) + (-0.1953074 * tmpvar_37.z))
     + 
      (0.01151259 * tmpvar_38.z)
    ) + (-0.2747939 * tmpvar_39.z)) + (-0.01325385 * tmpvar_40.z)) + (-0.02254234 * tmpvar_41.z))
   + 
    (0.05682861 * tmpvar_42.z)
  ) + (0.001243773 * tmpvar_43.z)) + (-0.01504623 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.06612524 * tmpvar_36.w) + (0.02036805 * tmpvar_37.w))
     + 
      (-0.03502752 * tmpvar_38.w)
    ) + (0.1109599 * tmpvar_39.w)) + (-0.06085733 * tmpvar_40.w)) + (0.06733562 * tmpvar_41.w))
   + 
    (0.01210843 * tmpvar_42.w)
  ) + (0.006343084 * tmpvar_43.w)) + (-0.004283166 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.06497726 * tmpvar_27.x) + (-0.1735995 * tmpvar_28.x))
     + 
      (-0.01117539 * tmpvar_29.x)
    ) + (-0.1898211 * tmpvar_30.x)) + (0.5939919 * tmpvar_31.x)) + (-0.0211456 * tmpvar_32.x))
   + 
    (-0.0644995 * tmpvar_33.x)
  ) + (-0.01432937 * tmpvar_34.x)) + (-0.01542395 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.03674411 * tmpvar_27.y) + (-0.004350364 * tmpvar_28.y))
     + 
      (0.01030464 * tmpvar_29.y)
    ) + (-0.001249477 * tmpvar_30.y)) + (-0.132788 * tmpvar_31.y)) + (0.03255599 * tmpvar_32.y))
   + 
    (-0.05238502 * tmpvar_33.y)
  ) + (0.0101765 * tmpvar_34.y)) + (-0.002676391 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.06123568 * tmpvar_27.z) + (0.143746 * tmpvar_28.z))
     + 
      (0.0561091 * tmpvar_29.z)
    ) + (0.0195991 * tmpvar_30.z)) + (0.1861681 * tmpvar_31.z)) + (-0.03179762 * tmpvar_32.z))
   + 
    (0.03634237 * tmpvar_33.z)
  ) + (0.02943194 * tmpvar_34.z)) + (0.04375102 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.1207364 * tmpvar_27.w) + (0.0733359 * tmpvar_28.w))
     + 
      (0.08390864 * tmpvar_29.w)
    ) + (-0.1152883 * tmpvar_30.w)) + (0.3467376 * tmpvar_31.w)) + (-0.03353531 * tmpvar_32.w))
   + 
    (0.04173902 * tmpvar_33.w)
  ) + (0.05826729 * tmpvar_34.w)) + (0.08858209 * tmpvar_35.w));
  float tmpvar_45;
  tmpvar_45 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.002800001)));
  s_8 = (((
    ((((
      ((-0.09027117 * tmpvar_36.x) + (-0.1462201 * tmpvar_37.x))
     + 
      (-0.1681085 * tmpvar_38.x)
    ) + (-0.247961 * tmpvar_39.x)) + (0.2572285 * tmpvar_40.x)) + (0.4709489 * tmpvar_41.x))
   + 
    (0.03202761 * tmpvar_42.x)
  ) + (0.1141089 * tmpvar_43.x)) + (0.1613444 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.001208347 * tmpvar_36.y) + (0.1730593 * tmpvar_37.y))
     + 
      (-0.05621104 * tmpvar_38.y)
    ) + (0.03625983 * tmpvar_39.y)) + (-0.03851184 * tmpvar_40.y)) + (-0.005532681 * tmpvar_41.y))
   + 
    (-0.01246358 * tmpvar_42.y)
  ) + (0.358765 * tmpvar_43.y)) + (0.1724837 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.4089749 * tmpvar_36.z) + (0.1742196 * tmpvar_37.z))
     + 
      (0.2864414 * tmpvar_38.z)
    ) + (-0.254775 * tmpvar_39.z)) + (-0.4277018 * tmpvar_40.z)) + (-0.1872668 * tmpvar_41.z))
   + 
    (0.1361511 * tmpvar_42.z)
  ) + (0.02696913 * tmpvar_43.z)) + (-0.15177 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.04463327 * tmpvar_36.w) + (-0.04876386 * tmpvar_37.w))
     + 
      (-0.03181839 * tmpvar_38.w)
    ) + (0.03954202 * tmpvar_39.w)) + (0.09516337 * tmpvar_40.w)) + (0.05247105 * tmpvar_41.w))
   + 
    (-0.1338337 * tmpvar_42.w)
  ) + (-0.2177699 * tmpvar_43.w)) + (0.01509758 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.2092236 * tmpvar_27.x) + (0.487778 * tmpvar_28.x))
     + 
      (0.2956695 * tmpvar_29.x)
    ) + (0.2397897 * tmpvar_30.x)) + (-0.5924875 * tmpvar_31.x)) + (-0.130632 * tmpvar_32.x))
   + 
    (0.06127845 * tmpvar_33.x)
  ) + (-0.1023452 * tmpvar_34.x)) + (0.002134229 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.07130507 * tmpvar_27.y) + (0.1219427 * tmpvar_28.y))
     + 
      (-0.01583503 * tmpvar_29.y)
    ) + (0.1403796 * tmpvar_30.y)) + (-0.3752097 * tmpvar_31.y)) + (-0.0674291 * tmpvar_32.y))
   + 
    (0.05821935 * tmpvar_33.y)
  ) + (-0.3546144 * tmpvar_34.y)) + (-0.07123769 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.468684 * tmpvar_27.z) + (-0.307398 * tmpvar_28.z))
     + 
      (-0.3881392 * tmpvar_29.z)
    ) + (-0.3384665 * tmpvar_30.z)) + (-0.08206715 * tmpvar_31.z)) + (0.1576573 * tmpvar_32.z))
   + 
    (-0.1655966 * tmpvar_33.z)
  ) + (-0.05595776 * tmpvar_34.z)) + (-0.1136846 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.4303523 * tmpvar_27.w) + (-0.8499131 * tmpvar_28.w))
     + 
      (-0.2505638 * tmpvar_29.w)
    ) + (0.3517926 * tmpvar_30.w)) + (1.016384 * tmpvar_31.w)) + (0.2395085 * tmpvar_32.w))
   + 
    (0.08583142 * tmpvar_33.w)
  ) + (-0.2591442 * tmpvar_34.w)) + (-0.04532335 * tmpvar_35.w));
  float tmpvar_46;
  tmpvar_46 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + 0.01728607)));
  s_8 = (((
    ((((
      ((0.101637 * tmpvar_36.x) + (-0.2347756 * tmpvar_37.x))
     + 
      (-0.03157821 * tmpvar_38.x)
    ) + (-0.2073496 * tmpvar_39.x)) + (-0.1643126 * tmpvar_40.x)) + (0.2424383 * tmpvar_41.x))
   + 
    (-0.1107575 * tmpvar_42.x)
  ) + (0.1676807 * tmpvar_43.x)) + (-0.418383 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((0.006255804 * tmpvar_36.y) + (0.04210049 * tmpvar_37.y))
     + 
      (0.003601404 * tmpvar_38.y)
    ) + (-0.08597467 * tmpvar_39.y)) + (0.04835159 * tmpvar_40.y)) + (-0.1337238 * tmpvar_41.y))
   + 
    (-0.06113401 * tmpvar_42.y)
  ) + (-0.3313762 * tmpvar_43.y)) + (0.01963125 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.1837768 * tmpvar_36.z) + (0.5899488 * tmpvar_37.z))
     + 
      (0.2991301 * tmpvar_38.z)
    ) + (0.7426049 * tmpvar_39.z)) + (-0.1369073 * tmpvar_40.z)) + (0.2463285 * tmpvar_41.z))
   + 
    (-0.03240025 * tmpvar_42.z)
  ) + (0.2981277 * tmpvar_43.z)) + (0.3513618 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.04465667 * tmpvar_36.w) + (-0.151357 * tmpvar_37.w))
     + 
      (0.1329019 * tmpvar_38.w)
    ) + (-0.04976351 * tmpvar_39.w)) + (-0.6689857 * tmpvar_40.w)) + (-0.2875652 * tmpvar_41.w))
   + 
    (0.04422787 * tmpvar_42.w)
  ) + (0.1417338 * tmpvar_43.w)) + (-0.02709503 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.01052452 * tmpvar_27.x) + (0.2286293 * tmpvar_28.x))
     + 
      (-0.1557599 * tmpvar_29.x)
    ) + (0.1965955 * tmpvar_30.x)) + (0.2584596 * tmpvar_31.x)) + (0.5399626 * tmpvar_32.x))
   + 
    (0.1819511 * tmpvar_33.x)
  ) + (0.2024899 * tmpvar_34.x)) + (0.08608274 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.05428705 * tmpvar_27.y) + (0.04735612 * tmpvar_28.y))
     + 
      (0.0861212 * tmpvar_29.y)
    ) + (-0.02886317 * tmpvar_30.y)) + (0.2038133 * tmpvar_31.y)) + (-0.1090936 * tmpvar_32.y))
   + 
    (0.01082627 * tmpvar_33.y)
  ) + (0.2342 * tmpvar_34.y)) + (-0.02250987 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.1786933 * tmpvar_27.z) + (0.126716 * tmpvar_28.z))
     + 
      (0.04626517 * tmpvar_29.z)
    ) + (0.07168674 * tmpvar_30.z)) + (0.323193 * tmpvar_31.z)) + (0.4282099 * tmpvar_32.z))
   + 
    (0.06280804 * tmpvar_33.z)
  ) + (0.13638 * tmpvar_34.z)) + (0.2957031 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.3181915 * tmpvar_27.w) + (-0.4878216 * tmpvar_28.w))
     + 
      (-0.3364154 * tmpvar_29.w)
    ) + (-0.4396847 * tmpvar_30.w)) + (-0.588631 * tmpvar_31.w)) + (0.06131746 * tmpvar_32.w))
   + 
    (-0.2816354 * tmpvar_33.w)
  ) + (-0.4900877 * tmpvar_34.w)) + (-0.5446552 * tmpvar_35.w));
  vec4 tmpvar_47;
  tmpvar_47.x = (((
    ((((
      ((((
        ((((
          ((-0.1067547 * tmpvar_36.x) + (-0.005462126 * tmpvar_37.x))
         + 
          (0.04762056 * tmpvar_38.x)
        ) + (-0.09147545 * tmpvar_39.x)) + (-0.3730899 * tmpvar_40.x)) + (0.293996 * tmpvar_41.x))
       + 
        (-0.0897252 * tmpvar_42.x)
      ) + (0.3313636 * tmpvar_43.x)) + (-0.05201459 * tmpvar_44.x)) + (((
        ((((
          ((0.02504269 * tmpvar_36.y) + (-0.06090801 * tmpvar_37.y))
         + 
          (-1.044219e-05 * tmpvar_38.y)
        ) + (0.06697992 * tmpvar_39.y)) + (-0.02915461 * tmpvar_40.y)) + (-0.002256695 * tmpvar_41.y))
       + 
        (-0.00791601 * tmpvar_42.y)
      ) + (0.09337469 * tmpvar_43.y)) + (-0.04010319 * tmpvar_44.y)))
     + 
      ((((
        ((((
          (0.2169379 * tmpvar_36.z)
         + 
          (-0.05516075 * tmpvar_37.z)
        ) + (-0.009791719 * tmpvar_38.z)) + (-0.333904 * tmpvar_39.z)) + (0.2752725 * tmpvar_40.z))
       + 
        (-0.1284082 * tmpvar_41.z)
      ) + (-0.1863914 * tmpvar_42.z)) + (-0.1360288 * tmpvar_43.z)) + (0.06346381 * tmpvar_44.z))
    ) + (
      ((((
        ((((-0.03963725 * tmpvar_36.w) + (-0.2679507 * tmpvar_37.w)) + (0.01213769 * tmpvar_38.w)) + (-0.1786923 * tmpvar_39.w))
       + 
        (-0.06644175 * tmpvar_40.w)
      ) + (0.01063086 * tmpvar_41.w)) + (-0.07681673 * tmpvar_42.w)) + (-0.004198385 * tmpvar_43.w))
     + 
      (-0.02652396 * tmpvar_44.w)
    )) + ((
      ((((
        (((0.1353172 * tmpvar_27.x) + (0.1293892 * tmpvar_28.x)) + (-0.05068118 * tmpvar_29.x))
       + 
        (0.06287757 * tmpvar_30.x)
      ) + (-0.08772176 * tmpvar_31.x)) + (0.006759793 * tmpvar_32.x)) + (0.1580953 * tmpvar_33.x))
     + 
      (-0.08294619 * tmpvar_34.x)
    ) + (0.06690071 * tmpvar_35.x))) + (((
      ((((
        ((0.01855818 * tmpvar_27.y) + (-0.1649325 * tmpvar_28.y))
       + 
        (0.02380415 * tmpvar_29.y)
      ) + (0.08744932 * tmpvar_30.y)) + (-0.02189814 * tmpvar_31.y)) + (0.02668494 * tmpvar_32.y))
     + 
      (0.03270375 * tmpvar_33.y)
    ) + (0.05236494 * tmpvar_34.y)) + (0.05692713 * tmpvar_35.y)))
   + 
    ((((
      ((((
        (-0.0901643 * tmpvar_27.z)
       + 
        (-0.09282382 * tmpvar_28.z)
      ) + (0.07358982 * tmpvar_29.z)) + (0.3232882 * tmpvar_30.z)) + (-1.059165 * tmpvar_31.z))
     + 
      (0.1712873 * tmpvar_32.z)
    ) + (0.2215914 * tmpvar_33.z)) + (-0.3007047 * tmpvar_34.z)) + (-0.05238468 * tmpvar_35.z))
  ) + (
    ((((
      ((((-0.06714734 * tmpvar_27.w) + (0.04850284 * tmpvar_28.w)) + (-0.01196067 * tmpvar_29.w)) + (-0.1810134 * tmpvar_30.w))
     + 
      (-0.3472767 * tmpvar_31.w)
    ) + (0.03026878 * tmpvar_32.w)) + (-0.09629506 * tmpvar_33.w)) + (-0.2813683 * tmpvar_34.w))
   + 
    (-0.1333474 * tmpvar_35.w)
  )) + 0.006057905);
  tmpvar_47.y = tmpvar_45;
  tmpvar_47.z = tmpvar_46;
  tmpvar_47.w = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + 0.02068674)));
  gl_FragColor = tmpvar_47;
}
`;

const frag4 = `
precision mediump float;
uniform sampler2D LUMAN3;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float z_1;
  float y_2;
  float x_3;
  float w_4;
  float v_5;
  float u_6;
  float t_7;
  float s_8;
  vec2 tmpvar_9;
  float tmpvar_10;
  tmpvar_10 = -(HOOKED_pt.x);
  tmpvar_9.x = tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(HOOKED_pt.y);
  tmpvar_9.y = tmpvar_11;
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (LUMAN3, (v_tex_pos + tmpvar_9));
  vec2 tmpvar_13;
  tmpvar_13.y = 0.0;
  tmpvar_13.x = tmpvar_10;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (LUMAN3, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = tmpvar_10;
  tmpvar_15.y = HOOKED_pt.y;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (LUMAN3, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.x = 0.0;
  tmpvar_17.y = tmpvar_11;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (LUMAN3, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (LUMAN3, v_tex_pos);
  vec2 tmpvar_20;
  tmpvar_20.x = 0.0;
  tmpvar_20.y = HOOKED_pt.y;
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (LUMAN3, (v_tex_pos + tmpvar_20));
  vec2 tmpvar_22;
  tmpvar_22.x = HOOKED_pt.x;
  tmpvar_22.y = tmpvar_11;
  vec4 tmpvar_23;
  tmpvar_23 = texture2D (LUMAN3, (v_tex_pos + tmpvar_22));
  vec2 tmpvar_24;
  tmpvar_24.y = 0.0;
  tmpvar_24.x = HOOKED_pt.x;
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (LUMAN3, (v_tex_pos + tmpvar_24));
  vec4 tmpvar_26;
  tmpvar_26 = texture2D (LUMAN3, (v_tex_pos + HOOKED_pt));
  vec4 tmpvar_27;
  tmpvar_27 = -(min (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_28;
  tmpvar_28 = -(min (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_29;
  tmpvar_29 = -(min (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_30;
  tmpvar_30 = -(min (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_31;
  tmpvar_31 = -(min (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_32;
  tmpvar_32 = -(min (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_33;
  tmpvar_33 = -(min (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_34;
  tmpvar_34 = -(min (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_35;
  tmpvar_35 = -(min (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_36;
  tmpvar_36 = max (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_37;
  tmpvar_37 = max (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_38;
  tmpvar_38 = max (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_39;
  tmpvar_39 = max (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_40;
  tmpvar_40 = max (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_41;
  tmpvar_41 = max (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_42;
  tmpvar_42 = max (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_43;
  tmpvar_43 = max (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_44;
  tmpvar_44 = max (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0));
  s_8 = (((
    ((((
      ((0.01127145 * tmpvar_36.x) + (-0.4288745 * tmpvar_37.x))
     + 
      (-0.1608638 * tmpvar_38.x)
    ) + (-0.2105586 * tmpvar_39.x)) + (0.2478622 * tmpvar_40.x)) + (-0.1384794 * tmpvar_41.x))
   + 
    (-0.1825846 * tmpvar_42.x)
  ) + (-0.3210045 * tmpvar_43.x)) + (0.01421907 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((0.02310524 * tmpvar_36.y) + (-0.01578845 * tmpvar_37.y))
     + 
      (-0.05053699 * tmpvar_38.y)
    ) + (0.03928471 * tmpvar_39.y)) + (0.1643707 * tmpvar_40.y)) + (0.0356428 * tmpvar_41.y))
   + 
    (-0.06268819 * tmpvar_42.y)
  ) + (0.07783894 * tmpvar_43.y)) + (0.009747119 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.0308217 * tmpvar_36.z) + (0.06083882 * tmpvar_37.z))
     + 
      (0.02587328 * tmpvar_38.z)
    ) + (0.01722329 * tmpvar_39.z)) + (0.08845148 * tmpvar_40.z)) + (0.0613771 * tmpvar_41.z))
   + 
    (0.06515027 * tmpvar_42.z)
  ) + (0.001954493 * tmpvar_43.z)) + (0.01724757 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.01293458 * tmpvar_36.w) + (0.07368678 * tmpvar_37.w))
     + 
      (-0.04034031 * tmpvar_38.w)
    ) + (0.06724782 * tmpvar_39.w)) + (-0.08931617 * tmpvar_40.w)) + (0.03122741 * tmpvar_41.w))
   + 
    (-0.06303663 * tmpvar_42.w)
  ) + (0.03044627 * tmpvar_43.w)) + (0.01211271 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.02466051 * tmpvar_27.x) + (-0.009060651 * tmpvar_28.x))
     + 
      (-0.003503904 * tmpvar_29.x)
    ) + (0.06341225 * tmpvar_30.x)) + (-0.525272 * tmpvar_31.x)) + (-0.005501108 * tmpvar_32.x))
   + 
    (0.0588685 * tmpvar_33.x)
  ) + (0.09516038 * tmpvar_34.x)) + (0.04720441 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((-0.0636953 * tmpvar_27.y) + (-0.06788222 * tmpvar_28.y))
     + 
      (0.009680431 * tmpvar_29.y)
    ) + (0.1161408 * tmpvar_30.y)) + (0.07604306 * tmpvar_31.y)) + (-0.2850213 * tmpvar_32.y))
   + 
    (0.06081603 * tmpvar_33.y)
  ) + (-0.07813028 * tmpvar_34.y)) + (0.01021094 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.02084716 * tmpvar_27.z) + (0.08855373 * tmpvar_28.z))
     + 
      (0.002358509 * tmpvar_29.z)
    ) + (0.04696443 * tmpvar_30.z)) + (0.02908232 * tmpvar_31.z)) + (-0.01044698 * tmpvar_32.z))
   + 
    (0.06933194 * tmpvar_33.z)
  ) + (-0.1097909 * tmpvar_34.z)) + (0.006627338 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.07595761 * tmpvar_27.w) + (0.210966 * tmpvar_28.w))
     + 
      (-0.001610302 * tmpvar_29.w)
    ) + (0.01423776 * tmpvar_30.w)) + (0.3981747 * tmpvar_31.w)) + (0.01783061 * tmpvar_32.w))
   + 
    (0.1089689 * tmpvar_33.w)
  ) + (0.05775906 * tmpvar_34.w)) + (-0.008378969 * tmpvar_35.w));
  float tmpvar_45;
  tmpvar_45 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + 0.007218698)));
  s_8 = (((
    ((((
      ((0.03472885 * tmpvar_36.x) + (-0.2426118 * tmpvar_37.x))
     + 
      (0.2837713 * tmpvar_38.x)
    ) + (-0.07902698 * tmpvar_39.x)) + (0.5332798 * tmpvar_40.x)) + (0.2586584 * tmpvar_41.x))
   + 
    (-0.003439914 * tmpvar_42.x)
  ) + (-0.4367498 * tmpvar_43.x)) + (0.03266132 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.07738957 * tmpvar_36.y) + (0.0572496 * tmpvar_37.y))
     + 
      (0.2050702 * tmpvar_38.y)
    ) + (0.1756603 * tmpvar_39.y)) + (0.01108127 * tmpvar_40.y)) + (-0.233518 * tmpvar_41.y))
   + 
    (-0.09890139 * tmpvar_42.y)
  ) + (0.01803675 * tmpvar_43.y)) + (0.04763589 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.02046929 * tmpvar_36.z) + (0.04759444 * tmpvar_37.z))
     + 
      (-0.002022923 * tmpvar_38.z)
    ) + (-0.2025691 * tmpvar_39.z)) + (-0.7826322 * tmpvar_40.z)) + (0.007257682 * tmpvar_41.z))
   + 
    (-0.0490066 * tmpvar_42.z)
  ) + (0.02904025 * tmpvar_43.z)) + (0.01782621 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.02008359 * tmpvar_36.w) + (0.06858024 * tmpvar_37.w))
     + 
      (0.06368863 * tmpvar_38.w)
    ) + (0.2049611 * tmpvar_39.w)) + (-0.1652869 * tmpvar_40.w)) + (-0.1018071 * tmpvar_41.w))
   + 
    (-0.1695055 * tmpvar_42.w)
  ) + (0.1002068 * tmpvar_43.w)) + (0.01237721 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.03253046 * tmpvar_27.x) + (0.06687301 * tmpvar_28.x))
     + 
      (-0.06845205 * tmpvar_29.x)
    ) + (-0.01015575 * tmpvar_30.x)) + (-0.4632993 * tmpvar_31.x)) + (-0.1307425 * tmpvar_32.x))
   + 
    (0.04800105 * tmpvar_33.x)
  ) + (0.123704 * tmpvar_34.x)) + (0.07485694 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.06206077 * tmpvar_27.y) + (0.1342826 * tmpvar_28.y))
     + 
      (-0.2443141 * tmpvar_29.y)
    ) + (-0.07213569 * tmpvar_30.y)) + (0.9167748 * tmpvar_31.y)) + (0.237506 * tmpvar_32.y))
   + 
    (0.04223396 * tmpvar_33.y)
  ) + (-0.3929338 * tmpvar_34.y)) + (-0.2623536 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.02131595 * tmpvar_27.z) + (0.09439878 * tmpvar_28.z))
     + 
      (0.01521116 * tmpvar_29.z)
    ) + (0.2038265 * tmpvar_30.z)) + (0.6901006 * tmpvar_31.z)) + (0.04216189 * tmpvar_32.z))
   + 
    (0.0677661 * tmpvar_33.z)
  ) + (-0.0232567 * tmpvar_34.z)) + (0.01457462 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.04407271 * tmpvar_27.w) + (0.1179461 * tmpvar_28.w))
     + 
      (0.03630912 * tmpvar_29.w)
    ) + (0.7663727 * tmpvar_30.w)) + (0.3971753 * tmpvar_31.w)) + (0.2200264 * tmpvar_32.w))
   + 
    (-0.01075488 * tmpvar_33.w)
  ) + (-0.0517687 * tmpvar_34.w)) + (-0.01091885 * tmpvar_35.w));
  float tmpvar_46;
  tmpvar_46 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + 0.02410564)));
  s_8 = (((
    ((((
      ((0.03076653 * tmpvar_36.x) + (0.1637359 * tmpvar_37.x))
     + 
      (0.2184196 * tmpvar_38.x)
    ) + (0.10914 * tmpvar_39.x)) + (0.05621998 * tmpvar_40.x)) + (0.2553113 * tmpvar_41.x))
   + 
    (0.05860166 * tmpvar_42.x)
  ) + (-0.02988465 * tmpvar_43.x)) + (-0.03693911 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.04501198 * tmpvar_36.y) + (0.09324016 * tmpvar_37.y))
     + 
      (0.09846852 * tmpvar_38.y)
    ) + (0.06726326 * tmpvar_39.y)) + (0.628559 * tmpvar_40.y)) + (-0.02637863 * tmpvar_41.y))
   + 
    (0.006447278 * tmpvar_42.y)
  ) + (0.04297645 * tmpvar_43.y)) + (0.008040234 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.01701852 * tmpvar_36.z) + (-1 * tmpvar_37.z))
     + 
      (0.05148241 * tmpvar_38.z)
    ) + (0.09698756 * tmpvar_39.z)) + (-0.06515222 * tmpvar_40.z)) + (0.0200851 * tmpvar_41.z))
   + 
    (0.04985655 * tmpvar_42.z)
  ) + (0.09850702 * tmpvar_43.z)) + (0.06601598 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.002991079 * tmpvar_36.w) + (0.02711342 * tmpvar_37.w))
     + 
      (0.05617722 * tmpvar_38.w)
    ) + (0.1544931 * tmpvar_39.w)) + (0.2867893 * tmpvar_40.w)) + (-0.03156254 * tmpvar_41.w))
   + 
    (-0.01511942 * tmpvar_42.w)
  ) + (0.05996688 * tmpvar_43.w)) + (0.009752991 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((-0.06231565 * tmpvar_27.x) + (-0.03341734 * tmpvar_28.x))
     + 
      (-0.07257243 * tmpvar_29.x)
    ) + (-0.04877089 * tmpvar_30.x)) + (-0.04723747 * tmpvar_31.x)) + (-0.1068337 * tmpvar_32.x))
   + 
    (-0.002816312 * tmpvar_33.x)
  ) + (-0.05710042 * tmpvar_34.x)) + (-0.01591127 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.0259395 * tmpvar_27.y) + (0.102185 * tmpvar_28.y))
     + 
      (-0.1053643 * tmpvar_29.y)
    ) + (-0.07116143 * tmpvar_30.y)) + (-0.3066342 * tmpvar_31.y)) + (0.06160229 * tmpvar_32.y))
   + 
    (0.03169828 * tmpvar_33.y)
  ) + (0.005768011 * tmpvar_34.y)) + (-0.1894646 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.01357799 * tmpvar_27.z) + (-0.02527815 * tmpvar_28.z))
     + 
      (0.00625481 * tmpvar_29.z)
    ) + (-0.08724931 * tmpvar_30.z)) + (0.1552288 * tmpvar_31.z)) + (-0.01562353 * tmpvar_32.z))
   + 
    (-0.04042024 * tmpvar_33.z)
  ) + (0.07587788 * tmpvar_34.z)) + (-0.02697492 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.05199736 * tmpvar_27.w) + (-0.04646599 * tmpvar_28.w))
     + 
      (0.02004394 * tmpvar_29.w)
    ) + (-0.1230899 * tmpvar_30.w)) + (-0.2667442 * tmpvar_31.w)) + (0.03994739 * tmpvar_32.w))
   + 
    (-0.03900633 * tmpvar_33.w)
  ) + (-0.08176985 * tmpvar_34.w)) + (0.03041807 * tmpvar_35.w));
  vec4 tmpvar_47;
  tmpvar_47.x = (((
    ((((
      ((((
        ((((
          ((-0.2382211 * tmpvar_36.x) + (-0.4922408 * tmpvar_37.x))
         + 
          (-0.2603839 * tmpvar_38.x)
        ) + (-0.2227011 * tmpvar_39.x)) + (-0.2319963 * tmpvar_40.x)) + (-0.08860003 * tmpvar_41.x))
       + 
        (-0.1115033 * tmpvar_42.x)
      ) + (-0.3189581 * tmpvar_43.x)) + (-0.03548281 * tmpvar_44.x)) + (((
        ((((
          ((0.06318636 * tmpvar_36.y) + (-0.5362933 * tmpvar_37.y))
         + 
          (-0.1015597 * tmpvar_38.y)
        ) + (-0.06471427 * tmpvar_39.y)) + (0.5817465 * tmpvar_40.y)) + (-0.1347465 * tmpvar_41.y))
       + 
        (0.00587013 * tmpvar_42.y)
      ) + (0.1711669 * tmpvar_43.y)) + (0.08656512 * tmpvar_44.y)))
     + 
      ((((
        ((((
          (-0.06168478 * tmpvar_36.z)
         + 
          (-0.014519 * tmpvar_37.z)
        ) + (-0.03889553 * tmpvar_38.z)) + (-0.1841108 * tmpvar_39.z)) + (0.06959173 * tmpvar_40.z))
       + 
        (-0.03780323 * tmpvar_41.z)
      ) + (-0.05407318 * tmpvar_42.z)) + (0.05846756 * tmpvar_43.z)) + (0.0526453 * tmpvar_44.z))
    ) + (
      ((((
        ((((0.1637899 * tmpvar_36.w) + (-0.1739257 * tmpvar_37.w)) + (-0.04402618 * tmpvar_38.w)) + (-0.3668979 * tmpvar_39.w))
       + 
        (0.1479145 * tmpvar_40.w)
      ) + (-0.03293263 * tmpvar_41.w)) + (-0.134844 * tmpvar_42.w)) + (0.02567259 * tmpvar_43.w))
     + 
      (0.001886049 * tmpvar_44.w)
    )) + ((
      ((((
        (((0 * tmpvar_27.x) + (-0.01839711 * tmpvar_28.x)) + (0.09268332 * tmpvar_29.x))
       + 
        (0.1563791 * tmpvar_30.x)
      ) + (-0.09361345 * tmpvar_31.x)) + (-0.1221518 * tmpvar_32.x)) + (-0.01812064 * tmpvar_33.x))
     + 
      (0.05284249 * tmpvar_34.x)
    ) + (0.02437495 * tmpvar_35.x))) + (((
      ((((
        ((-0.1876376 * tmpvar_27.y) + (0.3019662 * tmpvar_28.y))
       + 
        (0.08883403 * tmpvar_29.y)
      ) + (-0.05450314 * tmpvar_30.y)) + (-0.6387117 * tmpvar_31.y)) + (-0.05136764 * tmpvar_32.y))
     + 
      (0.06204774 * tmpvar_33.y)
    ) + (-0.2585287 * tmpvar_34.y)) + (-0.1657619 * tmpvar_35.y)))
   + 
    ((((
      ((((
        (0.1358712 * tmpvar_27.z)
       + 
        (0.08522579 * tmpvar_28.z)
      ) + (0.03095689 * tmpvar_29.z)) + (0.2544617 * tmpvar_30.z)) + (-0.1795436 * tmpvar_31.z))
     + 
      (0.1288762 * tmpvar_32.z)
    ) + (0.1652299 * tmpvar_33.z)) + (-0.1237182 * tmpvar_34.z)) + (0.01846106 * tmpvar_35.z))
  ) + (
    ((((
      ((((0.3369558 * tmpvar_27.w) + (0.2755598 * tmpvar_28.w)) + (0.1242229 * tmpvar_29.w)) + (0.4810716 * tmpvar_30.w))
     + 
      (0.2417095 * tmpvar_31.w)
    ) + (0.1090186 * tmpvar_32.w)) + (0.1475024 * tmpvar_33.w)) + (0.008883083 * tmpvar_34.w))
   + 
    (-0.06614558 * tmpvar_35.w)
  )) + -0.009210918);
  tmpvar_47.y = tmpvar_45;
  tmpvar_47.z = tmpvar_46;
  tmpvar_47.w = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.01254026)));
  gl_FragColor = tmpvar_47;
}


`;

const frag5 = `
precision mediump float;

uniform sampler2D LUMAN4;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  float z_1;
  float y_2;
  float x_3;
  float w_4;
  float v_5;
  float u_6;
  float t_7;
  float s_8;
  vec2 tmpvar_9;
  float tmpvar_10;
  tmpvar_10 = -(HOOKED_pt.x);
  tmpvar_9.x = tmpvar_10;
  float tmpvar_11;
  tmpvar_11 = -(HOOKED_pt.y);
  tmpvar_9.y = tmpvar_11;
  vec4 tmpvar_12;
  tmpvar_12 = texture2D (LUMAN4, (v_tex_pos + tmpvar_9));
  vec2 tmpvar_13;
  tmpvar_13.y = 0.0;
  tmpvar_13.x = tmpvar_10;
  vec4 tmpvar_14;
  tmpvar_14 = texture2D (LUMAN4, (v_tex_pos + tmpvar_13));
  vec2 tmpvar_15;
  tmpvar_15.x = tmpvar_10;
  tmpvar_15.y = HOOKED_pt.y;
  vec4 tmpvar_16;
  tmpvar_16 = texture2D (LUMAN4, (v_tex_pos + tmpvar_15));
  vec2 tmpvar_17;
  tmpvar_17.x = 0.0;
  tmpvar_17.y = tmpvar_11;
  vec4 tmpvar_18;
  tmpvar_18 = texture2D (LUMAN4, (v_tex_pos + tmpvar_17));
  vec4 tmpvar_19;
  tmpvar_19 = texture2D (LUMAN4, v_tex_pos);
  vec2 tmpvar_20;
  tmpvar_20.x = 0.0;
  tmpvar_20.y = HOOKED_pt.y;
  vec4 tmpvar_21;
  tmpvar_21 = texture2D (LUMAN4, (v_tex_pos + tmpvar_20));
  vec2 tmpvar_22;
  tmpvar_22.x = HOOKED_pt.x;
  tmpvar_22.y = tmpvar_11;
  vec4 tmpvar_23;
  tmpvar_23 = texture2D (LUMAN4, (v_tex_pos + tmpvar_22));
  vec2 tmpvar_24;
  tmpvar_24.y = 0.0;
  tmpvar_24.x = HOOKED_pt.x;
  vec4 tmpvar_25;
  tmpvar_25 = texture2D (LUMAN4, (v_tex_pos + tmpvar_24));
  vec4 tmpvar_26;
  tmpvar_26 = texture2D (LUMAN4, (v_tex_pos + HOOKED_pt));
  vec4 tmpvar_27;
  tmpvar_27 = -(min (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_28;
  tmpvar_28 = -(min (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_29;
  tmpvar_29 = -(min (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_30;
  tmpvar_30 = -(min (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_31;
  tmpvar_31 = -(min (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_32;
  tmpvar_32 = -(min (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_33;
  tmpvar_33 = -(min (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_34;
  tmpvar_34 = -(min (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_35;
  tmpvar_35 = -(min (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_36;
  tmpvar_36 = max (tmpvar_12, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_37;
  tmpvar_37 = max (tmpvar_14, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_38;
  tmpvar_38 = max (tmpvar_16, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_39;
  tmpvar_39 = max (tmpvar_18, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_40;
  tmpvar_40 = max (tmpvar_19, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_41;
  tmpvar_41 = max (tmpvar_21, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_42;
  tmpvar_42 = max (tmpvar_23, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_43;
  tmpvar_43 = max (tmpvar_25, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_44;
  tmpvar_44 = max (tmpvar_26, vec4(0.0, 0.0, 0.0, 0.0));
  s_8 = (((
    ((((
      ((0.08390676 * tmpvar_36.x) + (-0.01112306 * tmpvar_37.x))
     + 
      (-0.03269317 * tmpvar_38.x)
    ) + (-0.1921929 * tmpvar_39.x)) + (-0.05067645 * tmpvar_40.x)) + (0.07472215 * tmpvar_41.x))
   + 
    (0.08597711 * tmpvar_42.x)
  ) + (0.1157882 * tmpvar_43.x)) + (-0.2815821 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.02405043 * tmpvar_36.y) + (-0.1346828 * tmpvar_37.y))
     + 
      (0.01465429 * tmpvar_38.y)
    ) + (0.289773 * tmpvar_39.y)) + (0.6254546 * tmpvar_40.y)) + (0.1694739 * tmpvar_41.y))
   + 
    (-0.02675088 * tmpvar_42.y)
  ) + (0.03751677 * tmpvar_43.y)) + (0.2932169 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.01765992 * tmpvar_36.z) + (-0.0513346 * tmpvar_37.z))
     + 
      (0.01430815 * tmpvar_38.z)
    ) + (-0.07032843 * tmpvar_39.z)) + (-0.1246526 * tmpvar_40.z)) + (0.02709919 * tmpvar_41.z))
   + 
    (-0.04269256 * tmpvar_42.z)
  ) + (-0.3216088 * tmpvar_43.z)) + (-0.1244026 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((0.173668 * tmpvar_36.w) + (0.1686874 * tmpvar_37.w))
     + 
      (0.105285 * tmpvar_38.w)
    ) + (-0.2748816 * tmpvar_39.w)) + (-0.6290982 * tmpvar_40.w)) + (-0.2893757 * tmpvar_41.w))
   + 
    (0.02157495 * tmpvar_42.w)
  ) + (0.09045409 * tmpvar_43.w)) + (0.08872227 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.01142644 * tmpvar_27.x) + (-0.1635813 * tmpvar_28.x))
     + 
      (-0.2462823 * tmpvar_29.x)
    ) + (-0.1258281 * tmpvar_30.x)) + (0.3749163 * tmpvar_31.x)) + (0.6614622 * tmpvar_32.x))
   + 
    (0.1773997 * tmpvar_33.x)
  ) + (-0.2410345 * tmpvar_34.x)) + (-0.1251241 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.04965607 * tmpvar_27.y) + (0.350437 * tmpvar_28.y))
     + 
      (-0.06541586 * tmpvar_29.y)
    ) + (0.03638419 * tmpvar_30.y)) + (-0.882436 * tmpvar_31.y)) + (0.1508583 * tmpvar_32.y))
   + 
    (0.01566454 * tmpvar_33.y)
  ) + (0.2609933 * tmpvar_34.y)) + (-0.2365361 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.05713696 * tmpvar_27.z) + (0.3191505 * tmpvar_28.z))
     + 
      (0.09413395 * tmpvar_29.z)
    ) + (-0.05636728 * tmpvar_30.z)) + (0.500199 * tmpvar_31.z)) + (-0.101295 * tmpvar_32.z))
   + 
    (0.2279295 * tmpvar_33.z)
  ) + (0.2700824 * tmpvar_34.z)) + (0.1176671 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((-0.3027228 * tmpvar_27.w) + (-0.03281827 * tmpvar_28.w))
     + 
      (-0.009120692 * tmpvar_29.w)
    ) + (0.7295555 * tmpvar_30.w)) + (0.07897864 * tmpvar_31.w)) + (-0.03673119 * tmpvar_32.w))
   + 
    (-0.04899552 * tmpvar_33.w)
  ) + (-0.2323399 * tmpvar_34.w)) + (0.1206343 * tmpvar_35.w));
  float tmpvar_45;
  tmpvar_45 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.006999369)));
  s_8 = (((
    ((((
      ((-0.02185644 * tmpvar_36.x) + (-1 * tmpvar_37.x))
     + 
      (0.02784665 * tmpvar_38.x)
    ) + (-0.1285126 * tmpvar_39.x)) + (-0.4798021 * tmpvar_40.x)) + (0.3816084 * tmpvar_41.x))
   + 
    (0.1130843 * tmpvar_42.x)
  ) + (-0.4374286 * tmpvar_43.x)) + (0.4389651 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.05342144 * tmpvar_36.y) + (0.0963073 * tmpvar_37.y))
     + 
      (-0.1344111 * tmpvar_38.y)
    ) + (-0.1212212 * tmpvar_39.y)) + (-0.150467 * tmpvar_40.y)) + (-0.395402 * tmpvar_41.y))
   + 
    (-0.002849161 * tmpvar_42.y)
  ) + (0.2216871 * tmpvar_43.y)) + (-0.3393511 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((-0.02753673 * tmpvar_36.z) + (0.1355427 * tmpvar_37.z))
     + 
      (-0.08918299 * tmpvar_38.z)
    ) + (-0.1717359 * tmpvar_39.z)) + (0.4626848 * tmpvar_40.z)) + (-0.3535981 * tmpvar_41.z))
   + 
    (0.04633235 * tmpvar_42.z)
  ) + (0.02462448 * tmpvar_43.z)) + (-0.02316744 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.2345336 * tmpvar_36.w) + (0.07788929 * tmpvar_37.w))
     + 
      (0.1601279 * tmpvar_38.w)
    ) + (-0.4164352 * tmpvar_39.w)) + (-0.6417199 * tmpvar_40.w)) + (0.3087294 * tmpvar_41.w))
   + 
    (-0.146825 * tmpvar_42.w)
  ) + (0.2515725 * tmpvar_43.w)) + (-0.0602734 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.02821713 * tmpvar_27.x) + (0.1286794 * tmpvar_28.x))
     + 
      (-0.05617058 * tmpvar_29.x)
    ) + (0.2876299 * tmpvar_30.x)) + (-0.5784438 * tmpvar_31.x)) + (-0.360146 * tmpvar_32.x))
   + 
    (0.2161684 * tmpvar_33.x)
  ) + (-0.18587 * tmpvar_34.x)) + (-0.009710477 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.1239373 * tmpvar_27.y) + (-0.1120899 * tmpvar_28.y))
     + 
      (-0.07985599 * tmpvar_29.y)
    ) + (-0.6593528 * tmpvar_30.y)) + (1.684395 * tmpvar_31.y)) + (-0.3765403 * tmpvar_32.y))
   + 
    (-0.5687655 * tmpvar_33.y)
  ) + (0.3690439 * tmpvar_34.y)) + (0.22348 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((0.1057501 * tmpvar_27.z) + (-0.2861634 * tmpvar_28.z))
     + 
      (0.2226515 * tmpvar_29.z)
    ) + (-0.2137293 * tmpvar_30.z)) + (-0.9109312 * tmpvar_31.z)) + (0.01133888 * tmpvar_32.z))
   + 
    (0.1055891 * tmpvar_33.z)
  ) + (-0.4704106 * tmpvar_34.z)) + (0.1620624 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.9702835 * tmpvar_27.w) + (-0.8238047 * tmpvar_28.w))
     + 
      (-0.004306302 * tmpvar_29.w)
    ) + (0.4436007 * tmpvar_30.w)) + (-0.6943591 * tmpvar_31.w)) + (-0.1196196 * tmpvar_32.w))
   + 
    (0.1817444 * tmpvar_33.w)
  ) + (-0.05047322 * tmpvar_34.w)) + (0.07299529 * tmpvar_35.w));
  float tmpvar_46;
  tmpvar_46 = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.04262165)));
  s_8 = (((
    ((((
      ((0.01298512 * tmpvar_36.x) + (0.06978957 * tmpvar_37.x))
     + 
      (0.01288166 * tmpvar_38.x)
    ) + (-0.01308608 * tmpvar_39.x)) + (-0.1666321 * tmpvar_40.x)) + (0.1877882 * tmpvar_41.x))
   + 
    (-0.009702196 * tmpvar_42.x)
  ) + (0.0381909 * tmpvar_43.x)) + (-0.05022559 * tmpvar_44.x));
  t_7 = (((
    ((((
      ((-0.07929176 * tmpvar_36.y) + (-0.06990447 * tmpvar_37.y))
     + 
      (-0.06669893 * tmpvar_38.y)
    ) + (0.02525727 * tmpvar_39.y)) + (0.7689759 * tmpvar_40.y)) + (-0.10249 * tmpvar_41.y))
   + 
    (0.01719728 * tmpvar_42.y)
  ) + (-0.101945 * tmpvar_43.y)) + (0.09072582 * tmpvar_44.y));
  u_6 = (((
    ((((
      ((0.003040319 * tmpvar_36.z) + (0.01229459 * tmpvar_37.z))
     + 
      (-0.02340032 * tmpvar_38.z)
    ) + (-0.04359187 * tmpvar_39.z)) + (-0.1632777 * tmpvar_40.z)) + (-0.02788577 * tmpvar_41.z))
   + 
    (0.01873349 * tmpvar_42.z)
  ) + (-0.03432662 * tmpvar_43.z)) + (-0.05105706 * tmpvar_44.z));
  v_5 = (((
    ((((
      ((-0.06209299 * tmpvar_36.w) + (0.1810839 * tmpvar_37.w))
     + 
      (0.0864376 * tmpvar_38.w)
    ) + (-0.161979 * tmpvar_39.w)) + (-0.1286522 * tmpvar_40.w)) + (-0.06932794 * tmpvar_41.w))
   + 
    (0.001515311 * tmpvar_42.w)
  ) + (0.0184915 * tmpvar_43.w)) + (0.04909854 * tmpvar_44.w));
  w_4 = (((
    ((((
      ((0.01996098 * tmpvar_27.x) + (0.05178593 * tmpvar_28.x))
     + 
      (-0.2104464 * tmpvar_29.x)
    ) + (0.09824475 * tmpvar_30.x)) + (-0.1495831 * tmpvar_31.x)) + (0.3990458 * tmpvar_32.x))
   + 
    (0.01605206 * tmpvar_33.x)
  ) + (0.04970906 * tmpvar_34.x)) + (-0.1770668 * tmpvar_35.x));
  x_3 = (((
    ((((
      ((0.01956385 * tmpvar_27.y) + (0.1818472 * tmpvar_28.y))
     + 
      (-0.1198635 * tmpvar_29.y)
    ) + (-0.2601329 * tmpvar_30.y)) + (-0.2878523 * tmpvar_31.y)) + (0.0853055 * tmpvar_32.y))
   + 
    (0.02436001 * tmpvar_33.y)
  ) + (-0.2068587 * tmpvar_34.y)) + (-0.08642124 * tmpvar_35.y));
  y_2 = (((
    ((((
      ((-0.002838508 * tmpvar_27.z) + (-0.007392961 * tmpvar_28.z))
     + 
      (0.125504 * tmpvar_29.z)
    ) + (0.05340696 * tmpvar_30.z)) + (-0.2460126 * tmpvar_31.z)) + (-0.196357 * tmpvar_32.z))
   + 
    (-0.0359683 * tmpvar_33.z)
  ) + (0.1034848 * tmpvar_34.z)) + (-0.009769748 * tmpvar_35.z));
  z_1 = (((
    ((((
      ((0.2664726 * tmpvar_27.w) + (-0.6342077 * tmpvar_28.w))
     + 
      (-0.02826515 * tmpvar_29.w)
    ) + (0.06637238 * tmpvar_30.w)) + (0.5780939 * tmpvar_31.w)) + (0.06882983 * tmpvar_32.w))
   + 
    (-0.004849368 * tmpvar_33.w)
  ) + (-0.09338158 * tmpvar_34.w)) + (-0.1081253 * tmpvar_35.w));
  vec4 tmpvar_47;
  tmpvar_47.x = (((
    ((((
      ((((
        ((((
          ((0 * tmpvar_36.x) + (0.05732088 * tmpvar_37.x))
         + 
          (-0.04141264 * tmpvar_38.x)
        ) + (0.167919 * tmpvar_39.x)) + (0.1661773 * tmpvar_40.x)) + (-0.4870346 * tmpvar_41.x))
       + 
        (-0.1293156 * tmpvar_42.x)
      ) + (0.4140343 * tmpvar_43.x)) + (-0.3347067 * tmpvar_44.x)) + (((
        ((((
          ((0.03830889 * tmpvar_36.y) + (-0.05128253 * tmpvar_37.y))
         + 
          (0.09902938 * tmpvar_38.y)
        ) + (0.05117033 * tmpvar_39.y)) + (-1.005949 * tmpvar_40.y)) + (0.3998207 * tmpvar_41.y))
       + 
        (-0.02677152 * tmpvar_42.y)
      ) + (-0.2329233 * tmpvar_43.y)) + (0.2332318 * tmpvar_44.y)))
     + 
      ((((
        ((((
          (0.03380432 * tmpvar_36.z)
         + 
          (-0.1678914 * tmpvar_37.z)
        ) + (0.1155168 * tmpvar_38.z)) + (0.2096383 * tmpvar_39.z)) + (-0.5732962 * tmpvar_40.z))
       + 
        (0.3777884 * tmpvar_41.z)
      ) + (-0.03511609 * tmpvar_42.z)) + (0.08906399 * tmpvar_43.z)) + (0.07067735 * tmpvar_44.z))
    ) + (
      ((((
        ((((0.2285735 * tmpvar_36.w) + (-0.0790915 * tmpvar_37.w)) + (-0.3156393 * tmpvar_38.w)) + (0.5057771 * tmpvar_39.w))
       + 
        (-1.321746 * tmpvar_40.w)
      ) + (-0.1272184 * tmpvar_41.w)) + (0.1617791 * tmpvar_42.w)) + (-0.2629097 * tmpvar_43.w))
     + 
      (-0.002945977 * tmpvar_44.w)
    )) + ((
      ((((
        (((-0.03058634 * tmpvar_27.x) + (-0.133769 * tmpvar_28.x)) + (0.1397447 * tmpvar_29.x))
       + 
        (-0.242663 * tmpvar_30.x)
      ) + (-0.119474 * tmpvar_31.x)) + (0.1936729 * tmpvar_32.x)) + (-0.342371 * tmpvar_33.x))
     + 
      (0.3096073 * tmpvar_34.x)
    ) + (0.04313581 * tmpvar_35.x))) + (((
      ((((
        ((-0.1401241 * tmpvar_27.y) + (0.01680045 * tmpvar_28.y))
       + 
        (0.1570266 * tmpvar_29.y)
      ) + (0.7430246 * tmpvar_30.y)) + (-0.005562219 * tmpvar_31.y)) + (0.2613972 * tmpvar_32.y))
     + 
      (0.6424457 * tmpvar_33.y)
    ) + (-0.5143216 * tmpvar_34.y)) + (-0.114942 * tmpvar_35.y)))
   + 
    ((((
      ((((
        (-0.1017801 * tmpvar_27.z)
       + 
        (0.2330721 * tmpvar_28.z)
      ) + (-0.2932164 * tmpvar_29.z)) + (0.2449845 * tmpvar_30.z)) + (-1.128263 * tmpvar_31.z))
     + 
      (0.02241206 * tmpvar_32.z)
    ) + (-0.1683896 * tmpvar_33.z)) + (0.4005672 * tmpvar_34.z)) + (-0.2146331 * tmpvar_35.z))
  ) + (
    ((((
      ((((-1.005476 * tmpvar_27.w) + (0.8050052 * tmpvar_28.w)) + (0.1223533 * tmpvar_29.w)) + (-0.6732282 * tmpvar_30.w))
     + 
      (0.3369146 * tmpvar_31.w)
    ) + (0.06454999 * tmpvar_32.w)) + (-0.1776519 * tmpvar_33.w)) + (0.1038463 * tmpvar_34.w))
   + 
    (-0.1130251 * tmpvar_35.w)
  )) + -0.06119895);
  tmpvar_47.y = tmpvar_45;
  tmpvar_47.z = tmpvar_46;
  tmpvar_47.w = (((s_8 + t_7) + (u_6 + v_5)) + ((w_4 + x_3) + (
    (y_2 + z_1)
   + -0.01824195)));
  gl_FragColor = tmpvar_47;
}


`;

const frag6 = `
precision mediump float;

uniform sampler2D LUMAN1;
uniform sampler2D LUMAN2;
uniform sampler2D LUMAN3;
uniform sampler2D LUMAN4;
uniform sampler2D LUMAN5;
varying vec2 v_tex_pos;
void main ()
{
  vec4 tmpvar_1;
  tmpvar_1 = texture2D (LUMAN1, v_tex_pos);
  vec4 tmpvar_2;
  tmpvar_2 = texture2D (LUMAN2, v_tex_pos);
  vec4 tmpvar_3;
  tmpvar_3 = texture2D (LUMAN3, v_tex_pos);
  vec4 tmpvar_4;
  tmpvar_4 = texture2D (LUMAN4, v_tex_pos);
  vec4 tmpvar_5;
  tmpvar_5 = texture2D (LUMAN5, v_tex_pos);
  vec4 tmpvar_6;
  tmpvar_6 = -(min (tmpvar_1, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_7;
  tmpvar_7 = -(min (tmpvar_2, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_8;
  tmpvar_8 = -(min (tmpvar_3, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_9;
  tmpvar_9 = -(min (tmpvar_4, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_10;
  tmpvar_10 = -(min (tmpvar_5, vec4(0.0, 0.0, 0.0, 0.0)));
  vec4 tmpvar_11;
  tmpvar_11 = max (tmpvar_1, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_12;
  tmpvar_12 = max (tmpvar_2, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_13;
  tmpvar_13 = max (tmpvar_3, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_14;
  tmpvar_14 = max (tmpvar_4, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_15;
  tmpvar_15 = max (tmpvar_5, vec4(0.0, 0.0, 0.0, 0.0));
  vec4 tmpvar_16;
  tmpvar_16.x = (((
    ((((
      ((((
        ((((
          ((((
            ((((
              ((((
                ((((
                  ((((
                    ((((
                      ((0.01617009 * tmpvar_11.x) + (-0.07807932 * tmpvar_11.y))
                     + 
                      (-0.01608141 * tmpvar_11.z)
                    ) + (0.04596583 * tmpvar_11.w)) + (0.001067137 * tmpvar_6.x)) + (0.1360479 * tmpvar_6.y))
                   + 
                    (-0.1035081 * tmpvar_6.z)
                  ) + (-0.05372716 * tmpvar_6.w)) + (0.05931074 * tmpvar_12.x)) + (-0.03741526 * tmpvar_12.y))
                 + 
                  (0.007310368 * tmpvar_12.z)
                ) + (0.02138393 * tmpvar_12.w)) + (0.07797022 * tmpvar_7.x)) + (0.01027629 * tmpvar_7.y))
               + 
                (-0.0441517 * tmpvar_7.z)
              ) + (0.01834932 * tmpvar_7.w)) + (-0.1048062 * tmpvar_13.x)) + (-0.1960783 * tmpvar_13.y))
             + 
              (-0.01771637 * tmpvar_13.z)
            ) + (-0.03210694 * tmpvar_13.w)) + (0.03039751 * tmpvar_8.x)) + (0.1320561 * tmpvar_8.y))
           + 
            (0.02732447 * tmpvar_8.z)
          ) + (0.01163898 * tmpvar_8.w)) + (-0.04676417 * tmpvar_14.x)) + (-0.1418008 * tmpvar_14.y))
         + 
          (-0.04111024 * tmpvar_14.z)
        ) + (-0.3233351 * tmpvar_14.w)) + (-0.1383327 * tmpvar_9.x)) + (0.3551269 * tmpvar_9.y))
       + 
        (-0.08653635 * tmpvar_9.z)
      ) + (-0.158015 * tmpvar_9.w)) + (-0.2631638 * tmpvar_15.x)) + (-0.2056243 * tmpvar_15.y))
     + 
      (-0.09891177 * tmpvar_15.z)
    ) + (0.09735771 * tmpvar_15.w)) + (0.1722268 * tmpvar_10.x)) + (0.1022274 * tmpvar_10.y))
   + 
    (0.1769814 * tmpvar_10.z)
  ) + (-0.04597687 * tmpvar_10.w)) + -0.01651922);
  tmpvar_16.y = (((
    ((((
      ((((
        ((((
          ((((
            ((((
              ((((
                ((((
                  ((((
                    ((((
                      ((-0.007067313 * tmpvar_11.x) + (-0.1027941 * tmpvar_11.y))
                     + 
                      (-0.03086166 * tmpvar_11.z)
                    ) + (0.01937004 * tmpvar_11.w)) + (-0.001414304 * tmpvar_6.x)) + (0.05432107 * tmpvar_6.y))
                   + 
                    (-0.1563567 * tmpvar_6.z)
                  ) + (-0.05455238 * tmpvar_6.w)) + (0.02755026 * tmpvar_12.x)) + (0.01405624 * tmpvar_12.y))
                 + 
                  (-0.0161981 * tmpvar_12.z)
                ) + (0.03419058 * tmpvar_12.w)) + (-0.004207751 * tmpvar_7.x)) + (-0.0113672 * tmpvar_7.y))
               + 
                (0.0341807 * tmpvar_7.z)
              ) + (0.04015298 * tmpvar_7.w)) + (-0.06339332 * tmpvar_13.x)) + (0.003628058 * tmpvar_13.y))
             + 
              (-0.0106396 * tmpvar_13.z)
            ) + (0.02650885 * tmpvar_13.w)) + (-0.02524984 * tmpvar_8.x)) + (0.11937 * tmpvar_8.y))
           + 
            (-0.03120299 * tmpvar_8.z)
          ) + (-0.0213726 * tmpvar_8.w)) + (-0.02508037 * tmpvar_14.x)) + (-0.02184179 * tmpvar_14.y))
         + 
          (0.06487728 * tmpvar_14.z)
        ) + (-0.06460682 * tmpvar_14.w)) + (0.04119384 * tmpvar_9.x)) + (-0.008643975 * tmpvar_9.y))
       + 
        (-0.2078446 * tmpvar_9.z)
      ) + (0.1125917 * tmpvar_9.w)) + (-0.1056004 * tmpvar_15.x)) + (0.1478508 * tmpvar_15.y))
     + 
      (0.1384287 * tmpvar_15.z)
    ) + (-0.06915313 * tmpvar_15.w)) + (0.01069498 * tmpvar_10.x)) + (-0.03455625 * tmpvar_10.y))
   + 
    (-0.03377371 * tmpvar_10.z)
  ) + (0.06635877 * tmpvar_10.w)) + -0.002248366);
  tmpvar_16.z = (((
    ((((
      ((((
        ((((
          ((((
            ((((
              ((((
                ((((
                  ((((
                    ((((
                      ((0.02117986 * tmpvar_11.x) + (-0.05177673 * tmpvar_11.y))
                     + 
                      (0.1554409 * tmpvar_11.z)
                    ) + (0.0703093 * tmpvar_11.w)) + (-0.01141107 * tmpvar_6.x)) + (0.005516341 * tmpvar_6.y))
                   + 
                    (0.06413486 * tmpvar_6.z)
                  ) + (-0.04561594 * tmpvar_6.w)) + (0.03372611 * tmpvar_12.x)) + (-0.05227042 * tmpvar_12.y))
                 + 
                  (0.01922251 * tmpvar_12.z)
                ) + (0.02011268 * tmpvar_12.w)) + (-0.1160939 * tmpvar_7.x)) + (0.03349734 * tmpvar_7.y))
               + 
                (-0.06132894 * tmpvar_7.z)
              ) + (-0.1065853 * tmpvar_7.w)) + (0.03806717 * tmpvar_13.x)) + (0.08673184 * tmpvar_13.y))
             + 
              (0.08148008 * tmpvar_13.z)
            ) + (0.01015049 * tmpvar_13.w)) + (-0.01687007 * tmpvar_8.x)) + (0.01104681 * tmpvar_8.y))
           + 
            (0.009952575 * tmpvar_8.z)
          ) + (0.0201371 * tmpvar_8.w)) + (-0.06427216 * tmpvar_14.x)) + (-0.1253467 * tmpvar_14.y))
         + 
          (-0.09109642 * tmpvar_14.z)
        ) + (-0.4655063 * tmpvar_14.w)) + (-0.1370387 * tmpvar_9.x)) + (0.2406361 * tmpvar_9.y))
       + 
        (-0.3357916 * tmpvar_9.z)
      ) + (-0.08938409 * tmpvar_9.w)) + (-0.09131308 * tmpvar_15.x)) + (-0.1799832 * tmpvar_15.y))
     + 
      (-0.3335457 * tmpvar_15.z)
    ) + (-0.2085112 * tmpvar_15.w)) + (0.2110073 * tmpvar_10.x)) + (0.0667875 * tmpvar_10.y))
   + 
    (0.2376604 * tmpvar_10.z)
  ) + (0.1057372 * tmpvar_10.w)) + -0.02392052);
  tmpvar_16.w = (((
    ((((
      ((((
        ((((
          ((((
            ((((
              ((((
                ((((
                  ((((
                    ((((
                      ((-0.06296154 * tmpvar_11.x) + (0.06051705 * tmpvar_11.y))
                     + 
                      (0.1138646 * tmpvar_11.z)
                    ) + (0.01939905 * tmpvar_11.w)) + (-0.01561016 * tmpvar_6.x)) + (0.003777239 * tmpvar_6.y))
                   + 
                    (0.04038177 * tmpvar_6.z)
                  ) + (0.02090138 * tmpvar_6.w)) + (0.0468376 * tmpvar_12.x)) + (0.004552797 * tmpvar_12.y))
                 + 
                  (0.08530895 * tmpvar_12.z)
                ) + (-0.002066109 * tmpvar_12.w)) + (-0.07511526 * tmpvar_7.x)) + (0.01650069 * tmpvar_7.y))
               + 
                (0.02598286 * tmpvar_7.z)
              ) + (-0.06396683 * tmpvar_7.w)) + (0.1402471 * tmpvar_13.x)) + (0.03896333 * tmpvar_13.y))
             + 
              (-0.07023641 * tmpvar_13.z)
            ) + (0.01385442 * tmpvar_13.w)) + (-0.02339635 * tmpvar_8.x)) + (-0.1074973 * tmpvar_8.y))
           + 
            (0.01841929 * tmpvar_8.z)
          ) + (0.005112186 * tmpvar_8.w)) + (-0.09815741 * tmpvar_14.x)) + (-0.2484099 * tmpvar_14.y))
         + 
          (-0.01761279 * tmpvar_14.z)
        ) + (-0.4855205 * tmpvar_14.w)) + (-0.1139957 * tmpvar_9.x)) + (0.2751265 * tmpvar_9.y))
       + 
        (-0.4713016 * tmpvar_9.z)
      ) + (0.009285934 * tmpvar_9.w)) + (-0.1139569 * tmpvar_15.x)) + (0.04294104 * tmpvar_15.y))
     + 
      (-0.3359849 * tmpvar_15.z)
    ) + (0.1475313 * tmpvar_15.w)) + (0.1823363 * tmpvar_10.x)) + (0.06840005 * tmpvar_10.y))
   + 
    (0.2392133 * tmpvar_10.z)
  ) + (-0.08792704 * tmpvar_10.w)) + -0.02083634);
  gl_FragColor = tmpvar_16;
}


`;

const frag7 = `
precision mediump float;

uniform sampler2D HOOKED;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.y = 0.0;
  tmpvar_1.x = HOOKED_pt.x;
  vec4 tmpvar_2;
  tmpvar_2 = texture2D (HOOKED, (v_tex_pos - tmpvar_1));
  vec4 tmpvar_3;
  tmpvar_3 = texture2D (HOOKED, v_tex_pos);
  vec4 tmpvar_4;
  tmpvar_4 = texture2D (HOOKED, (v_tex_pos + tmpvar_1));
  vec2 tmpvar_5;
  tmpvar_5.x = min (min (tmpvar_2.x, tmpvar_3.x), tmpvar_4.x);
  tmpvar_5.y = max (max (tmpvar_2.x, tmpvar_3.x), tmpvar_4.x);
  vec4 tmpvar_6;
  tmpvar_6.zw = vec2(0.0, 0.0);
  tmpvar_6.xy = tmpvar_5;
  gl_FragColor = tmpvar_6;
}
`;

const frag8 = `
precision mediump float;

uniform sampler2D MMKERNEL;
uniform vec2 HOOKED_pt;
varying vec2 v_tex_pos;
void main ()
{
  vec2 tmpvar_1;
  tmpvar_1.x = 0.0;
  tmpvar_1.y = HOOKED_pt.y;
  vec4 tmpvar_2;
  tmpvar_2 = texture2D (MMKERNEL, v_tex_pos);
  vec2 tmpvar_3;
  tmpvar_3.x = min (min (texture2D (MMKERNEL, (v_tex_pos - tmpvar_1)).x, tmpvar_2.x), texture2D (MMKERNEL, (v_tex_pos + tmpvar_1)).x);
  tmpvar_3.y = max (max (texture2D (MMKERNEL, (v_tex_pos - tmpvar_1)).y, tmpvar_2.y), texture2D (MMKERNEL, (v_tex_pos + tmpvar_1)).y);
  vec4 tmpvar_4;
  tmpvar_4.zw = vec2(0.0, 0.0);
  tmpvar_4.xy = tmpvar_3;
  gl_FragColor = tmpvar_4;
}

`;

const frag9 = `
precision mediump float;

uniform sampler2D HOOKED;
uniform sampler2D LUMAN0;
uniform sampler2D MMKERNEL;
varying vec2 v_tex_pos;
uniform float LUMAN0_size;
uniform vec2 LUMAN0_pt;
void main ()
{
  float c_t_1;
  float tmpvar_2;
  tmpvar_2 = texture2D (LUMAN0, (((vec2(0.5, 0.5) - 
    fract((v_tex_pos * LUMAN0_size))
  ) * LUMAN0_pt) + v_tex_pos)).y;
  float tmpvar_3;
  tmpvar_3 = abs(tmpvar_2);
  c_t_1 = tmpvar_3;
  if (((tmpvar_3 > 0.001) && (tmpvar_3 < 0.1))) {
    c_t_1 = ((tmpvar_3 - 0.001) / 0.099);
    c_t_1 = ((pow (c_t_1, 0.6) * 0.099) + 0.001);
    c_t_1 = (c_t_1 * sign(tmpvar_2));
    vec4 tmpvar_4;
    tmpvar_4.w = 0.0;
    vec4 tmpvar_5;
    tmpvar_5 = texture2D (MMKERNEL, v_tex_pos);
    vec4 tmpvar_6;
    tmpvar_6 = texture2D (HOOKED, v_tex_pos);
    tmpvar_4.x = clamp ((c_t_1 + tmpvar_6.x), tmpvar_5.x, tmpvar_5.y);
    tmpvar_4.yz = tmpvar_6.yz;
    gl_FragColor = tmpvar_4;
  } else {
    vec4 tmpvar_7;
    tmpvar_7.w = 0.0;
    vec4 tmpvar_8;
    tmpvar_8 = texture2D (HOOKED, v_tex_pos);
    tmpvar_7.x = (tmpvar_2 + tmpvar_8.x);
    tmpvar_7.yz = tmpvar_8.yz;
    gl_FragColor = tmpvar_7;
  };
}


`;

const fragDraw = `
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
    this.program0 = createProgram(gl, quadVert, frag0);
    this.program1 = createProgram(gl, quadVert, frag1);
    this.program2 = createProgram(gl, quadVert, frag2);
    this.program3 = createProgram(gl, quadVert, frag3);
    this.program4 = createProgram(gl, quadVert, frag4);
    this.program5 = createProgram(gl, quadVert, frag5);
    this.program6 = createProgram(gl, quadVert, frag6);
    this.program7 = createProgram(gl, quadVert, frag7);
    this.program8 = createProgram(gl, quadVert, frag8);
    this.program9 = createProgram(gl, quadVert, frag9);
    this.programDraw = createProgram(gl, quadVert, fragDraw);

    this.temp0Texture = null;
    this.temp1Texture = null;
    this.outputTexture = null;
    this.mmkernelTexture = null;
    
    this.luman0Texture = null;
    this.luman1Texture = null;
    this.luman2Texture = null;
    this.luman3Texture = null;
    this.luman4Texture = null;
    this.luman5Texture = null;
    this.luman6Texture = null;

    this.scale = 4.0;
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

    this.temp0Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.temp1Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.outputTexture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.mmkernelTexture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    
    this.luman0Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman1Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman2Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman3Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman4Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman5Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
    this.luman6Texture = createTexture(gl, gl.LINEAR, emptyPixels, width, height);
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

    // Nasty trick to fix video quailty changing bug.
    if (this.gl.getError() == this.gl.INVALID_VALUE) {
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
        updateTexture(this.gl, this.inputTex, this.inputMov);
    }

    // Automatic change scale according to original video resolution.
    // Upscaled to 1440p.
    let newScale = 1440 / this.inputMov.videoHeight;
    if (this.scale != newScale){
        this.scale = newScale;
        console.log('Setting scale to ' + this.scale);
    }

    this.gl.disable(this.gl.DEPTH_TEST);
    this.gl.disable(this.gl.STENCIL_TEST);

    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    // Frag0
    bindFramebuffer(this.gl, this.framebuffer, this.luman0Texture); // SAVE LUMAN0
    this.gl.useProgram(this.program0.program);
    bindAttribute(this.gl, this.quadBuffer, this.program0.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program0.HOOKED, 0);
    this.gl.uniform2f(this.program0.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag1
    bindFramebuffer(this.gl, this.framebuffer, this.luman1Texture); // SAVE LUMAN1
    this.gl.useProgram(this.program1.program);
    bindAttribute(this.gl, this.quadBuffer, this.program1.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program1.HOOKED, 0);
    bindTexture(this.gl, this.luman0Texture, 1); // LUMAN0
    this.gl.uniform1i(this.program1.LUMAN0, 1);
    this.gl.uniform2f(this.program1.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag2
    bindFramebuffer(this.gl, this.framebuffer, this.luman2Texture); // SAVE LUMAN2
    this.gl.useProgram(this.program2.program);
    bindAttribute(this.gl, this.quadBuffer, this.program2.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program2.HOOKED, 0);
    bindTexture(this.gl, this.luman1Texture, 1); // LUMAN1
    this.gl.uniform1i(this.program2.LUMAN1, 1);
    this.gl.uniform2f(this.program2.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag3
    bindFramebuffer(this.gl, this.framebuffer, this.luman3Texture); // SAVE LUMAN3
    this.gl.useProgram(this.program3.program);
    bindAttribute(this.gl, this.quadBuffer, this.program3.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program3.HOOKED, 0);
    bindTexture(this.gl, this.luman2Texture, 1); // LUMAN2
    this.gl.uniform1i(this.program3.LUMAN2, 1);
    this.gl.uniform2f(this.program3.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag4
    bindFramebuffer(this.gl, this.framebuffer, this.luman4Texture); // SAVE LUMAN4
    this.gl.useProgram(this.program4.program);
    bindAttribute(this.gl, this.quadBuffer, this.program4.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program4.HOOKED, 0);
    bindTexture(this.gl, this.luman3Texture, 1); // LUMAN3
    this.gl.uniform1i(this.program4.LUMAN3, 1);
    this.gl.uniform2f(this.program4.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag5
    bindFramebuffer(this.gl, this.framebuffer, this.luman5Texture); // SAVE LUMAN5
    this.gl.useProgram(this.program5.program);
    bindAttribute(this.gl, this.quadBuffer, this.program5.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program5.HOOKED, 0);
    bindTexture(this.gl, this.luman4Texture, 1); // LUMAN4
    this.gl.uniform1i(this.program5.LUMAN4, 1);
    this.gl.uniform2f(this.program5.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag6
    bindFramebuffer(this.gl, this.framebuffer, this.temp0Texture); // SAVE LUMAN0
    this.gl.useProgram(this.program6.program);
    bindAttribute(this.gl, this.quadBuffer, this.program6.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program6.HOOKED, 0);
    bindTexture(this.gl, this.luman0Texture, 1); // LUMAN0
    this.gl.uniform1i(this.program6.LUMAN0, 1);
    bindTexture(this.gl, this.luman1Texture, 2); // LUMAN1
    this.gl.uniform1i(this.program6.LUMAN1, 2);
    bindTexture(this.gl, this.luman2Texture, 3); // LUMAN2
    this.gl.uniform1i(this.program6.LUMAN2, 3);
    bindTexture(this.gl, this.luman3Texture, 4); // LUMAN3
    this.gl.uniform1i(this.program6.LUMAN3, 4);
    bindTexture(this.gl, this.luman4Texture, 5); // LUMAN4
    this.gl.uniform1i(this.program6.LUMAN4, 5);
    bindTexture(this.gl, this.luman5Texture, 6); // LUMAN5
    this.gl.uniform1i(this.program6.LUMAN5, 6);
    this.gl.uniform2f(this.program6.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    
    // Frag7
    bindFramebuffer(this.gl, this.framebuffer, this.mmkernelTexture); // SAVE MMKERNEL
    this.gl.useProgram(this.program7.program);
    bindAttribute(this.gl, this.quadBuffer, this.program7.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program7.HOOKED, 0);
    this.gl.uniform2f(this.program7.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag8
    bindFramebuffer(this.gl, this.framebuffer, this.temp1Texture); // SAVE MMKERNEL
    this.gl.useProgram(this.program8.program);
    bindAttribute(this.gl, this.quadBuffer, this.program8.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program8.HOOKED, 0);
    bindTexture(this.gl, this.mmkernelTexture, 1); // MMKERNEL
    this.gl.uniform1i(this.program8.MMKERNEL, 1);
    this.gl.uniform2f(this.program8.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Frag9
    bindFramebuffer(this.gl, this.framebuffer, this.outputTexture); // SAVE
    this.gl.useProgram(this.program9.program);
    bindAttribute(this.gl, this.quadBuffer, this.program9.a_pos, 2);

    bindTexture(this.gl, this.inputTex, 0); // HOOKED NATIVE
    this.gl.uniform1i(this.program9.HOOKED, 0);
    bindTexture(this.gl, this.temp1Texture, 1); // MMKERNEL
    this.gl.uniform1i(this.program9.MMKERNEL, 1);
    bindTexture(this.gl, this.temp0Texture, 2); // LUMAN0
    this.gl.uniform1i(this.program9.LUMAN0, 2);
    this.gl.uniform2f(this.program9.HOOKED_pt, 1.0 / this.gl.canvas.width, 1.0 / this.gl.canvas.height);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Draw
    bindFramebuffer(this.gl, null);
    this.gl.useProgram(this.programDraw.program);
    bindAttribute(this.gl, this.quadBuffer, this.programDraw.a_pos, 2);
    bindTexture(this.gl, this.outputTexture, 0); // luman0
    this.gl.uniform1i(this.programDraw.u_texture, 0);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
}

// Parameters.
let globalScaler = null;
let globalMovOrig = null;
let globalBoard = null;
let globalScale = 4.0;
let globalCurrentHref=window.location.href

let globalUpdateId, globalPreviousDelta = 0;
let globalFpsLimit = 60;    // Limit fps to 30 fps. Change here if you want more frames to be rendered. (But usually 30 fps is pretty enough for most anime as they are mostly done on threes.)

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
    while(div.className!="bilibili-player-video") {
        await new Promise(r => setTimeout(r, 500));
    }
    div = globalMovOrig.parentElement
    div.style.backgroundColor = "black" // Patch for ACFun.

    if (!globalBoard){
        console.log("globalBoard not exists. Creating new one.")

        globalBoard = document.createElement('canvas');
        // Make it visually fill the positioned parent
        globalBoard.style.width = '100%';
        globalBoard.style.height = '100%';
        // ...then set the internal size to match
        globalBoard.width = globalBoard.offsetWidth;
        globalBoard.height = globalBoard.offsetHeight;
        // Add it back to the div where contains the video tag we use as input.
    }
    console.log("Adding new canvas.")
    div.appendChild(globalBoard)

    // Hide original video tag, we don't need it to be displayed.
    globalMovOrig.style.display = 'none'
}

async function getVideoTag() {
    while(document.getElementsByTagName("video").length <= 0) {
        await new Promise(r => setTimeout(r, 200));
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

(async function () {
    console.log('Bilibili_Anime4K starting...')
    await injectCanvas()
    doFilter()
})();
