/*************************************************
* Creator: Wendel B. Silva
* Created: 2010.10.25
* Rendering Objects
* Classes: Mesh, Lines
* Common Methods: createBuffers(), renderObj()
*
* Each class knows how to render its specific type
**************************************************/

ArrayStrToFloat = function(c){
  for(i=0; i<c.length; i++)
    c[i] = parseFloat(c[i]);
}

ArrayStrToInt = function(c){
  for(i=0; i<c.length; i++)
    c[i] = parseInt(c[i]);
}

function setShader(s, isTextured) {
  gl = window.render.gl;

  gl.useProgram(s);  
  s.vertexPositionAttribute = gl.getAttribLocation(s, "aVertexPosition");
  gl.enableVertexAttribArray(s.vertexPositionAttribute);
  s.vertexNormalAttribute = gl.getAttribLocation(s, "aVertexNormal");
  gl.enableVertexAttribArray(s.vertexNormalAttribute);  
  s.vertexColorAttribute = gl.getAttribLocation(s, "aVertexColor");
  gl.enableVertexAttribArray(s.vertexColorAttribute);

  if (isTextured){
    s.textureCoordAttribute = gl.getAttribLocation(s, "aTextureCoord");
    gl.enableVertexAttribArray(s.textureCoordAttribute);
    s.samplerUniform = gl.getUniformLocation(s, "uSampler");  
  }

  s.useLightingUniform = gl.getUniformLocation(s, "uUseLighting");
  s.useLocalColorUniform = gl.getUniformLocation(s, "uUseLocalColor");
  s.localColorUniform = gl.getUniformLocation(s, "uLocalColor");
  s.localAlpha = gl.getUniformLocation(s, "uLocalAlpha");

  gl.uniform1i(s.useLocalColorUniform, window.render.useLocalColor);
  gl.uniform1f(s.localAlpha, window.render.localAlpha);

  s.pUniform = gl.getUniformLocation(s, "uPMatrix");
  s.mvUniform = gl.getUniformLocation(s, "uMVMatrix");
  s.nUniform = gl.getUniformLocation(s, "uNMatrix");   
}


function Mesh(){
  //CONSTANTS
  this.VERTEX  = 0;
  this.INDEX   = 1;
  this.NORMAL  = 2;
  this.COLOR   = 3;
  this.TEXTURE = 4;
  //VARIABLES
  this.vbuff = [null, null, null, null, null];  //MESH BUFFERS
  this.isTextured = false;
  this.id = "";
  this.modified = false;
  //SHADERS
  this.shader = null;

  //SETTERS
  this.setShader = function(s){
    this.shader = s;
    setShader(this.shader, this.isTextured);
  }
  this.setId = function(i){
    this.id = i;
  }
  this.setVertices = function(v){
    this.objVertices = v;
    if (typeof this.objVertices[0] == "string") ArrayStrToFloat(this.objVertices);
    this.modified = true;
  }
  this.setNormals = function(n){
    this.objNormal = n;
    if (typeof this.objNormal[0] == "string") ArrayStrToFloat(this.objNormal);
    this.modified = true;
  }
  this.setIndexes = function(i){
    this.objIndex = i;
    if (typeof this.objIndex[0] == "string") ArrayStrToInt(this.objIndex);
    this.modified = true;
  }

  this.setColors = function(c){
    this.objColors = c;
    if (typeof this.objColors[0] == "string") ArrayStrToFloat(this.objColors);
    this.modified = true;
  }
  this.setTexCoord = function(tc){
    this.objTexCoord = tc;
    if (typeof this.objTexCoord[0] == "string") ArrayStrToFloat(this.objTexCoord);
    this.modified = true;
  }
  this.setIsTextured = function(tex){
    this.isTextured = tex;
    this.modified = true;
    if (this.isTextured) this.setShader(window.render.shaders.shaderTexture);
    else this.setShader(window.render.shaders.shaderColor);
  }
  this.setTransfMatrix = function(trans){
    if (trans.length == 16) this.transfMatrix = trans;
    else this.transfMatrix = [1.0, 0.0, 0.0, 0.0, 
                              0.0, 1.0, 0.0, 0.0, 
                              0.0, 0.0, 1.0, 0.0, 
                              0.0, 0.0, 0.0, 1.0];
  }

  //GETTER
  this.getId = function(i){
    return this.id;
  }

  this.deleteBuffers = function(){
    if (this.vbuff[this.VERTEX] != null){ gl.deleteBuffer(this.vbuff[this.VERTEX]); this.vbuff[this.VERTEX] = null; }
    if (this.vbuff[this.NORMAL] != null){ gl.deleteBuffer(this.vbuff[this.NORMAL]); this.vbuff[this.NORMAL] = null; }
    if (this.vbuff[this.COLOR] != null){ gl.deleteBuffer(this.vbuff[this.COLOR]); this.vbuff[this.COLOR] = null; }
    if (this.vbuff[this.TEXTURE] != null){ gl.deleteBuffer(this.vbuff[this.TEXTURE]); this.vbuff[this.TEXTURE] = null; }
    if (this.vbuff[this.INDEX] != null){ gl.deleteBuffer(this.vbuff[this.INDEX]); this.vbuff[this.INDEX] = null; }
    this.modified = true;
  }

  //CREATE BUFFERS
  this.createBuffers = function(){
    if (this.objVertices == null || this.objNormal == null || this.objColors == null || this.objIndex == null ||     this.modified == false) return;
    this.deleteBuffers();

    // Vertex Buffer
    this.vbuff[this.VERTEX] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.VERTEX]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objVertices), gl.STATIC_DRAW);
    this.vbuff[this.VERTEX].itemSize = 3;
    this.vbuff[this.VERTEX].numItems = this.objVertices.length;

    //Normal Buffer
    this.vbuff[this.NORMAL] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.NORMAL]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objNormal), gl.STATIC_DRAW);
    this.vbuff[this.NORMAL].itemSize = 3;
    this.vbuff[this.NORMAL].numItems = this.objNormal.length;

    //Color Buffer
    this.vbuff[this.COLOR] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.COLOR]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objColors), gl.STATIC_DRAW);
    this.vbuff[this.COLOR].itemSize = 4;
    this.vbuff[this.COLOR].numItems = this.objColors.length;

    //Texture Buffer
    if (this.isTextured){
      this.vbuff[this.TEXTURE] = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.TEXTURE]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objTexCoord), gl.STATIC_DRAW);
      this.vbuff[this.TEXTURE].itemSize = 2;
      this.vbuff[this.TEXTURE].numItems = this.objTexCoord.length;
    }

    //Vertex Index Buffer
    this.vbuff[this.INDEX] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbuff[this.INDEX]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.objIndex), gl.STREAM_DRAW);
    this.vbuff[this.INDEX].itemSize = 3;  
    this.vbuff[this.INDEX].numItems = this.objIndex.length;

    this.modified = false;
  }

  //RENDER OBJ
  this.render = function(www){
    s = this.shader;
    setShader(this.shader, this.isTextured);

    matrix = window.render.matrix;
    matrix.pushMatrix();

    var m1 = Matrix.I(4)
    var i = 0;
    for(i=0; i<16;i++){
      rr = Math.floor(i/4);
      cc = i%4;
      m1.elements[rr][cc] = this.transfMatrix[i];
    }
    m1.ensure4x4();
    
    matrix.mvMatrix = matrix.mvMatrix.x(m1)
    window.render.setMatrixUniforms();
    gl.useProgram(s);
    gl.uniform1i(s.useLightingUniform, true);
    if (this.isTextured){
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(s.samplerUniform, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.TEXTURE]);
        gl.vertexAttribPointer(s.textureCoordAttribute, this.vbuff[this.TEXTURE].itemSize, gl.FLOAT, false, 0, 0);      
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.VERTEX]);
    gl.vertexAttribPointer(s.vertexPositionAttribute, this.vbuff[this.VERTEX].itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.NORMAL]);
    gl.vertexAttribPointer(s.vertexNormalAttribute, this.vbuff[this.NORMAL].itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbuff[this.COLOR]);
    gl.vertexAttribPointer(s.vertexColorAttribute, this.vbuff[this.COLOR].itemSize, gl.FLOAT, false, 0, 0);      
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.vbuff[this.INDEX]);
    gl.drawElements(gl.TRIANGLES, this.vbuff[this.INDEX].numItems, gl.UNSIGNED_SHORT, 0);
    matrix.popMatrix();
  }
}

function Lines(){
  //CONSTANTS
  this.VERTEX  = 0;
  this.INDEX   = 1;
  this.NORMAL  = 2;
  this.COLOR   = 3;
  this.TEXTURE = 4;
  //VARIABLES
  this.lbuff = [null, null, null, null, null]; //MESH BUFF
  this.isTextured = false;
  this.id = "";
  this.modified = false;
  //SHADERS
  this.shader = null;

  //SETTERS
  this.setShader = function(s){
    this.shader = s;
    setShader(this.shader, this.isTextured);
  }
  this.setId = function(i){
    this.id = i;
  }
  this.setPoints = function(p){
    this.objLinePoints = p;
    this.objLineNormals = p;
    //TODO: Fixed the need of a fake normal to the line: Wendel
    this.modified = true;
  }
  this.setIndexes = function(i){
    this.objLineIndex = i;
    this.modified = true;
  }
  this.setColors = function(c){
    this.objLineColors = c;
    this.modified = true;
  }
  this.setTransfMatrix = function(trans){
    this.transfMatrix = trans;
  }

  this.setIsTextured = function(i){
    this.setShader(window.render.shaders.shaderColor);
  }


  //GETTER
  this.getId = function(i){
    return this.id;
  }  

  this.deleteBuffers = function(){
    if (this.lbuff[this.VERTEX] != null){ gl.deleteBuffer(this.lbuff[this.VERTEX]); this.lbuff[this.VERTEX] = null; }
    if (this.lbuff[this.COLOR] != null){ gl.deleteBuffer(this.lbuff[this.COLOR]); this.lbuff[this.COLOR] = null; }
    if (this.lbuff[this.INDEX] != null){ gl.deleteBuffer(this.lbuff[this.INDEX]); this.lbuff[this.INDEX] = null; }
    if (this.lbuff[this.NORMAL] != null){ gl.deleteBuffer(this.lbuff[this.NORMAL]); this.lbuff[this.NORMAL] = null; }
    //TODO: Need to fix the need of a fake normal to the line: Wendel
    this.modified = true;
  }

  //CREATE BUFFERS
  this.createBuffers = function(){
    if (this.objLinePoints == null || this.objLineIndex == null || this.objLineColors == null || this.modified == false) return;
    this.deleteBuffers();
    // Vertex Buffer
    this.lbuff[this.VERTEX] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.VERTEX]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objLinePoints), gl.STATIC_DRAW);
    this.lbuff[this.VERTEX].itemSize = 3;
    this.lbuff[this.VERTEX].numItems = this.objLinePoints.length;

    //Color Buffer
    this.lbuff[this.COLOR] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.COLOR]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objLineColors), gl.STATIC_DRAW);
    this.lbuff[this.COLOR].itemSize = 4;
    this.lbuff[this.COLOR].numItems = this.objLineColors.length;

    //Normal Buffer
    this.lbuff[this.NORMAL] = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.NORMAL]);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.objLineNormals), gl.STATIC_DRAW);
    this.lbuff[this.NORMAL].itemSize = 3;
    this.lbuff[this.NORMAL].numItems = this.objLineNormals.length;

    //Vertex Index Buffer
    this.lbuff[this.INDEX] = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lbuff[this.INDEX]);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.objLineIndex), gl.STREAM_DRAW);
    this.lbuff[this.INDEX].itemSize = 2;
    this.lbuff[this.INDEX].numItems = this.objLineIndex.length;

    this.modified = false;
  }
  //RENDER OBJ
  this.render = function(www){
    if (this.lbuff[this.VERTEX] == null || this.lbuff[this.COLOR] == null || this.lbuff[this.INDEX] == null) return;
    setShader(this.shader, this.isTextured);

    gl.useProgram(this.shader);
    gl.uniform1i(this.shader.useLightingUniform, false);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.VERTEX]);
    gl.vertexAttribPointer(this.shader.vertexPositionAttribute, this.lbuff[this.VERTEX].itemSize, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.COLOR]);
    gl.vertexAttribPointer(this.shader.vertexColorAttribute, this.lbuff[this.COLOR].itemSize, gl.FLOAT, false, 0, 0);      

    //TODO: Fixed the need of a fake normal to the line: Wendel
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lbuff[this.NORMAL]);
    gl.vertexAttribPointer(this.shader.vertexNormalAttribute, this.lbuff[this.NORMAL].itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.lbuff[this.INDEX]);
    gl.drawElements(gl.LINES, this.lbuff[this.INDEX].numItems, gl.UNSIGNED_SHORT, 0); 
  }

  this.renderObj = function(w){ this.render(w); }
}





/**/
