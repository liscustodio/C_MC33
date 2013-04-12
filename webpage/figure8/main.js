//
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
         window.webkitRequestAnimationFrame ||
         window.mozRequestAnimationFrame ||
         window.oRequestAnimationFrame ||
         window.msRequestAnimationFrame ||
         function(callback, element) {
         window.setTimeout(callback, 1000/60);
       };
})();

// Singleton UTILS
  var utils = new function() {
  this.path = "./";

  this.loadScripts = function(url){
    head = document.getElementsByTagName('head')[0];

    while (url.length > 0){
      script = document.createElement('script');
      script.type = 'application/javascript';
      script.async = false;

      request = new XMLHttpRequest();
      request.open("GET", this.path + url[0], false);
      request.send(null);
      script.text = request.responseText;
      head.appendChild(script); 
  
      url.splice(0, 1);
    }
  }

  this.loadCSS = function(url){
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/css';
    script.rel = "stylesheet";
    script.src = this.path + url[0];
    head.appendChild(script); 
  }
}

//  WebGL Framework
//Need a new name
function Render(){
  this.gl = null;

  this.Id = "123";
  
  this.width = 640;
  this.height = 480;

  this.parent = null;
}

Render.prototype.setParentById = function(parent){
  if (this.parent){
    this.parent.innerHTML = this.oldHtml;
  }
  this.parent = document.getElementById(parent)
  this.oldHtml = this.parent.innerHTML;
  if (this.canvasHtml){
    this.parent.innerHTML = this.canvasHtml;
  }
}

Render.prototype.start = function(){
  scripts = ["sylvester.js", "glUtils.js", "renderingObjs.js", "vistrails.js"];

  utils.loadScripts(scripts, this.start2, this);
  this.start3();
}

Render.prototype.setSize = function(w, h) {
  this.width = w;
  this.height = h;
  if (this.canvas){
    this.canvas.width = w;
    this.canvas.height = h;
  }
  if (this.gl){
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;
  }
}

Render.prototype.start2 = function(sender){
  sender.start3();
}

Render.prototype.initMatrix = function(){
  this.matrix = new function(){
    this.rotation = Matrix.I(4);
    this.mvMatrix = Matrix.I(4);
    this.perspective = Matrix.I(4);

    this.loadIdentity = function(){
      this.mvMatrix = Matrix.I(4);
    }

    this.mult = function(m){
      this.mvMatrix = this.mvMatrix.x(m);
    }

    this.translate = function(v){
      m = Matrix.Translate($V([v[0], v[1], v[2]])).ensure4x4();
      this.mvMatrix = this.mvMatrix.x(m)
    }

    this.scale = function(v){
      m = Matrix.Scale($V([v, v, v])).ensure4x4();
      this.mvMatrix = this.mvMatrix.x(m);
    }

    this.rotate = function(angle, v){
      var inRadians = angle * Math.PI / 180.0;      
      var m = Matrix.Rotation(inRadians, $V([v[0], v[1], v[2]])).ensure4x4();
      this.mvMatrix = this.mvMatrix.x(m);
    }

    this.stack = [];

    this.pushMatrix = function(m) {
      if (m) {
        this.stack.push(m.dup());
        this.mvMatrix = m.dup();
      } else {
        this.stack.push(this.mvMatrix.dup());
      }
    }

    this.popMatrix = function() {
      if (!this.stack.length) {
        throw("Can't pop from an empty matrix stack.");
      }
      
      this.mvMatrix = this.stack.pop();
      return this.mvMatrix;
    }
  }
}

Render.prototype.initFps = function(){
  this.fps = new function(){
    this.count = 0;
    this.value = 0;
    this.framesPerStatus = 10;
    this.last = 0;

    this.tick = function(){
      if (this.count >= this.framesPerStatus){
        end = new Date().getTime();
        this.value = this.count*(1000.0/(end-this.last));
        this.count = 0;
        this.last = end;
      } else this.count++;
    }
  }
}

Render.prototype.initCamera = function(){
  this.camera = new function(){
    this.fov = 45.0;
    this.eye = [0.0, 0.0, -1.0];
    this.center = [0.0, 0.0, 0.0];
    this.up = [0.0, 1.0, 0.0];
    this.near = 0.01;
    this.far = 100000000000.0;

    this.translation = [0.0, 0.0, 0.0];
    this.rotation = Matrix.I(4);
    this.scale = 1.0;

    this.locked = false;
  }
}

Render.prototype.initScene = function(){
  this.objects = new function(){
    this.count = 0;
    this.list = [];
  }
}

Render.prototype.initBackground = function(){
  this.background = new function(){
    this.gradient = false;
    this.color1 = [1, 1, 1];
    this.color2 = [1, 1, 1];

    this.setColor1 = function(r, g, b){
      this.color1 = [r, g, b];
    }

    this.setColor2 = function(r, g, b){
      this.color2 = [r, g, b];
    }

    this.isGradient = function(b){
      this.gradient = b;
    }

    this.updateColor = function(){
      if (this.gradient){
        this.colors = new Float32Array([this.color1[0], this.color1[1], this.color1[2], 1.0,
                  this.color1[0], this.color1[1], this.color1[2], 1.0,
                  this.color2[0], this.color2[1], this.color2[2], 1.0,
                  this.color2[0], this.color2[1], this.color2[2], 1.0]);
      } else {
        this.colors = new Float32Array([this.color1[0], this.color1[1], this.color1[2], 1.0,
                  this.color1[0], this.color1[1], this.color1[2], 1.0,
                  this.color1[0], this.color1[1], this.color1[2], 1.0,
                  this.color1[0], this.color1[1], this.color1[2], 1.0]);
      }
      if (this.cbuff){
        window.render.gl.bindBuffer(window.render.gl.ARRAY_BUFFER, this.cbuff);
        window.render.gl.bufferData(window.render.gl.ARRAY_BUFFER, this.colors, window.render.gl.STATIC_DRAW);
        this.cbuff.itemSize=4;
      }
    }
  }

  this.background.vertices = new Float32Array([-1.0,-1.0,0.0,1.0,-1.0,0.0,1.0,1.0,0.0,-1.0,1.0,0.0]);
  this.background.colors = new Float32Array([1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  this.background.index = new Uint16Array([0,1,2,0,2,3]);
  this.background.normals = new Float32Array([0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0,0.0,0.0,-1.0]);
  this.background.numberOfIndex = 6;

  this.background.vbuff = this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.vbuff);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, this.background.vertices, this.gl.STATIC_DRAW);
  this.background.vbuff.itemSize=3;

  this.background.nbuff=this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.nbuff);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, this.background.normals, this.gl.STATIC_DRAW);
  this.background.nbuff.itemSize=3;

  this.background.cbuff=this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.cbuff);
  this.gl.bufferData(this.gl.ARRAY_BUFFER, this.background.colors, this.gl.STATIC_DRAW);
  this.background.cbuff.itemSize=4;

  this.background.ibuff=this.gl.createBuffer();
  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.background.ibuff);
  this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.background.index, this.gl.STREAM_DRAW);
}

Render.prototype.initInteraction = function(){
  this.interaction = new function(){
    this.mouseDown = false;
    this.mouseLastX = 0;
    this.mouseLastY = 0;

    this.onMouseMove = null;
    this.onMouseUp = null;
    this.onMouseDown = null;
  }
}

Render.prototype.initCanvas = function(){
    this.canvasName = "glCanvas";
    this.canvasHtml = '<canvas id="' + this.canvasName + '" style="border: none; overflow: hidden; position:absolute;';
    this.canvasHtml += ' z-index:0; left:0px; " width="' + this.width + '" height="' + this.height + '" ';
    this.canvasHtml += ' onmousedown="handleMouseDown(event,\'' + this.Id + '\')" \
    onmousemove="handleMouseMove(event,\'' + this.Id + '\')" \
    onmouseup="handleMouseUp(event,\'' + this.Id + '\')" \
    oncontextmenu="consumeEvent(event)"> Your browser doesn\'t appear to support the HTML5\
    </canvas>';
    
    this.canvasHtml += '<canvas id="' + this.canvasName + '2D" style="border: none; overflow: hidden; position:absolute;';
    this.canvasHtml += ' z-index:1; left:0px; " width="' + this.width + '" height="' + this.height + '" ';
    this.canvasHtml += ' onmousedown="handleMouseDown(event,\'' + this.Id + '\')" \
    onmousemove="handleMouseMove(event,\'' + this.Id + '\')" \
    onmouseup="handleMouseUp(event,\'' + this.Id + '\')" \
    oncontextmenu="consumeEvent(event)">1</canvas>';
    
  if (this.parent){
    this.parent.innerHTML = this.canvasHtml;
  }

  this.canvas = document.getElementById(this.canvasName);
  this.canvas.OnMouseDown = handleMouseDown;
  this.canvas.zindex = 0;
  this.canvas.border = "none";
  this.canvas.autosize = false;

  this.canvas2D = document.getElementById(this.canvasName + "2D");
  this.canvas2D.OnMouseDown = handleMouseDown;
  this.canvas2D.zindex = 1;
  this.canvas2D.border = "none";

  this.updateCanvas();
}

Render.prototype.updateCanvas = function(){
 // this.canvas.style.cssText = 'border: ' + this.canvas.border + '; overflow: hidden; z-index=' + this.canvas.zindex;

    if (this.canvas.autosize){
        this.canvas.style.cssText += " width: 100%; height: 100%;";
    }
}

Render.prototype.initVars = function(){
  this.initFps();
  this.initCamera();
  this.initScene();
  this.initMatrix();
  this.initInteraction();

  //todo:
  this.useLocalColors = false;
  this.localAlpha = 1.0;
}

Render.prototype.setClearColor = function(r, g, b){
  if (!this.clearColor) this.clearColor = [0.5, 0.5, 0.5];
  this.clearColor[0] = r;
  this.clearColor[1] = g;
  this.clearColor[2] = b;
  if (this.gl) this.gl.clearColor(this.clearColor[0], this.clearColor[1], this.clearColor[2], 1.0);
}

Render.prototype.start3 = function(){
  window.render = this;

  this.initVars();
  this.initCanvas(); 
  this.initWebGL();
  this.initBackground();

  if (this.gl) {
    this.setClearColor(0, 0, 0);
    this.gl.clearDepth(10.0);                       
    this.gl.enable(this.gl.DEPTH_TEST);            
    this.gl.depthFunc(this.gl.LEQUAL);
    this.gl.disable(this.gl.CULL_FACE);             

    this.initShaders();
    this.drawScene();
  }
}

// Initialize WebGL Context
Render.prototype.initWebGL = function() {
  this.gl = null;

  try {
    try { this.gl = this.canvas.getContext("webgl"); } catch (x) { this.gl = null; }
    if (this.gl == null){ 
      try { this.gl = this.canvas.getContext("experimental-webgl"); } catch (x) { this.gl = null; }
    } 
    this.gl.viewportWidth = this.canvas.width;
    this.gl.viewportHeight = this.canvas.height;
  } catch(e) {}
  var gl = this.gl;
  if (!this.gl) {
    alert("Sorry, your browser do not support WebGL.");
  }
}

function getShader(gl, id) {
    var shaderScript = document.getElementById(id);
    if (!shaderScript) {
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k) {
        if (k.nodeType == 3) {
            str += k.textContent;
        }
        k = k.nextSibling;
    }
    var shader;
    if (shaderScript.type == "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

// Initialize the shaders of our scene
Render.prototype.initShaders = function() {
  gl = this.gl;

  var vertexColor   = getShader(gl, "shader-vs");
  var fragmentColor = getShader(gl, "shader-fs");

  // Create the Color Shader Program
  this.shaders = new function(){
    this.shaderColor = null;
  };

  this.shaders.shaderColor = gl.createProgram();
  gl.attachShader(this.shaders.shaderColor, vertexColor);
  gl.attachShader(this.shaders.shaderColor, fragmentColor);
  gl.linkProgram(this.shaders.shaderColor);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(this.shaders.shaderColor, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }
  
  gl.useProgram(this.shaders.shaderColor);  
}

Render.prototype.drawScene = function() {  
  window.requestAnimFrame(window.render.drawScene, window.render.canvas);

  render = window.render;
  gl = render.gl;
  render.renderScene();
/**/
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); 
  render.matrix.perspective = glu.makeOrtho(-1.0,1.0,-1.0,1.0,1.0,1000000.0);
  render.matrix.mvMatrix = Matrix.I(4);

  gl.disable(gl.DEPTH_TEST);
  render.renderBackground();
  gl.enable(gl.DEPTH_TEST);

  render.matrix.perspective = glu.makePerspective(render.camera.fov, gl.viewportWidth/gl.viewportHeight, 
                              render.camera.near, render.camera.far);
  render.matrix.mvMatrix = Matrix.I(4);
  render.matrix.mvMatrix = glu.makeLookAt(render.camera.eye[0], render.camera.eye[1], render.camera.eye[2],
                           render.camera.center[0], render.camera.center[1], render.camera.center[2],
                           render.camera.up[0], render.camera.up[1], render.camera.up[2]);
  //Wendel
  render.renderScene();
/**/
  render.fps.tick();
  document.title = "FPS:" + render.fps.value;
}

Render.prototype.renderBackground = function(){
  s = this.shaders.shaderColor;

  setShader(s, false);

  this.matrix.translate([0.0, 0.0,-1.0]);
  this.setMatrixUniforms();

  this.gl.useProgram(s);
  this.gl.uniform1i(s.useLightingUniform, true);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.vbuff);
  this.gl.vertexAttribPointer(s.vertexPositionAttribute, this.background.vbuff.itemSize,this.gl.FLOAT,false,0,0);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.nbuff);
  this.gl.vertexAttribPointer(s.vertexNormalAttribute,this.background.nbuff.itemSize,this.gl.FLOAT,false,0,0);

  this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.background.cbuff);
  this.gl.vertexAttribPointer(s.vertexColorAttribute,this.background.cbuff.itemSize,this.gl.FLOAT,false,0,0);

  this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER,this.background.ibuff);

  this.gl.drawElements(this.gl.TRIANGLES,this.background.numberOfIndex,this.gl.UNSIGNED_SHORT,0);
}


Render.prototype.renderScene = function(){
  // Render
  this.matrix.pushMatrix();
    camerapos = [this.camera.center[0]*-1, this.camera.center[1]*-1, this.camera.center[2]*-1];
    mtrans = [-this.camera.translation[0], -this.camera.translation[1], -this.camera.translation[2]];
    m1 = glu.cameraRotation(this.camera.eye[0], this.camera.eye[1], this.camera.eye[2], 
                           this.camera.center[0], this.camera.center[1], this.camera.center[2], 
                           this.camera.up[0], this.camera.up[1], this.camera.up[2]);
    m2 = m1.transpose();
    
    this.matrix.translate(this.camera.translation);
    this.matrix.translate(this.camera.center);
    this.matrix.mvMatrix = this.matrix.mvMatrix.x(m2);

    this.matrix.scale(this.camera.scale);
    this.matrix.mvMatrix = this.matrix.mvMatrix.x(this.camera.rotation);

    this.matrix.mvMatrix = this.matrix.mvMatrix.x(m1);
    this.matrix.translate(camerapos);
    this.matrix.translate(mtrans);
    
    this.setMatrixUniforms();

    // Render
    for(i=0; i<this.objects.count; i++){
      this.objects.list[i].render();
    }
  this.matrix.popMatrix();
}

Render.prototype.setMatrixUniforms = function() {
  gl.useProgram(this.shaders.shaderColor);
  gl.uniformMatrix4fv(this.shaders.shaderColor.pUniform, false, new Float32Array(this.matrix.perspective.flatten()));
  gl.uniformMatrix4fv(this.shaders.shaderColor.mvUniform, false, new Float32Array(this.matrix.mvMatrix.flatten()));

  mvMatrixInv = this.matrix.mvMatrix.inverse();
  var normal = mvMatrixInv.transpose();
  gl.uniformMatrix4fv(this.shaders.shaderColor.nUniform, false, new Float32Array(normal.flatten()));

}

function handleMouseDown(event) {
  window.render.interaction.mouseDown = true;
  window.render.interaction.mouseLastX = event.clientX;
  window.render.interaction.mouseLastY = event.clientY;
  for(i=0; i<window.render.objects.count; i++) 
    if( window.render.objects.list[i].__proto__.constructor.name == "VolumeRender" ) 
      window.render.objects.list[i].isTransforming = true;

  if (window.render.interaction.onMouseDown) window.render.interaction.onMouseDown();
  event.preventDefault();
}


function handleMouseUp(event) {
  window.render.interaction.mouseDown = false;
  for(i=0; i < window.render.objects.count; i++) 
    if( window.render.objects.list[i].__proto__.constructor.name == "VolumeRender")
      window.render.objects.list[i].isTransforming = false;

  if (window.render.interaction.onMouseUp) window.render.interaction.onMouseUp();
  event.preventDefault();
}


function handleMouseMove(event) {
  if (!window.render.interaction.mouseDown) return;

  var newX = event.clientX;
  var newY = event.clientY;
  var deltaX = newX - window.render.interaction.mouseLastX;
  var deltaY = newY - window.render.interaction.mouseLastY;

  window.render.interaction.mouseLastX = event.clientX;
  window.render.interaction.mouseLastY = event.clientY;

  if (event.button == 0){
    var rX = deltaX/50.0;  
    var rY = deltaY/50.0;
    var mx = Matrix.Rotation(rX, $V([0, 1, 0])).ensure4x4();
    var my = Matrix.Rotation(rY, $V([1, 0, 0])).ensure4x4();

    mx = mx.x(my);
    window.render.camera.rotation = mx.x(window.render.camera.rotation);

  } else if (event.button == 1){
    dz = Math.abs(window.render.camera.eye[2]-window.render.camera.center[2]);
    var tx = (dz/window.render.camera.scale)*deltaX/1500.0;
    var ty = (dz/window.render.camera.scale)*deltaY/1500.0;

    window.render.camera.translation[0] += tx;
    window.render.camera.translation[1] -= ty;

  } else if (event.button == 2){
    window.render.camera.scale -= deltaY/500.0;
  }
  if (window.render.interaction.onMouseMove) window.render.interaction.onMouseMove();
}

function consumeEvent(event){
  if( event.preventDefault ){
    event.preventDefault();
  } else {
    event.returnValue = false;
  }
}
