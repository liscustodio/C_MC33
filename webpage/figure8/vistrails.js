getFloat = function(ss, pos, size){
  b = new Int8Array(size*4);
  for(i = 0; i<size*4; i++) b[i] = ss[pos+i];
  return new Float32Array(b.buffer);
}

var numObjs = 0;
var streamData = [];
var iPos = 0;
var iFilename = "";
var pCurr = 0;  //Used in the progressbar
var pTotal = 10;//Used in the progressbar

parseObject = function(){
    //Get Type
    code = String.fromCharCode(streamData[iPos++]);
    //Mesh      
    if (code == 'M'){
    //Vertices
      numVertices=(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      vertices = getFloat(streamData, iPos, numVertices);
      iPos += numVertices*4;
    //Normals
      numNormals =(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      normals = getFloat(streamData, iPos, numNormals);
      iPos += numNormals*4;
    //Colors
      numColors  =(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      colors = getFloat(streamData, iPos, numColors);
      iPos += numColors*4;
    //Indices
      numIndices =(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      indices = getFloat(streamData, iPos, numIndices);
      iPos += numIndices*4;
    //Matrix
      matrix = getFloat(streamData, iPos, 16);
      iPos += 16*4;

    //Add Object
      //if (vistrails.findObject(filename) == -1){
        aux = new Mesh();

        aux.setIsTextured(false);
        aux.setId(iFilename);
        aux.setVertices(vertices);
        //aux.setPoints(vec);
        aux.setNormals(normals);
        aux.setIndexes(indices);
        aux.setColors(colors);
        //aux.setTexCoord(vec);
        aux.setTransfMatrix(matrix);
        //aux.setData(vec);
        vistrails.render.objects.list[vistrails.render.objects.count++] = aux;
      //}
    } else if (code == 'L'){
    //Points
      numPoints=(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      points = getFloat(streamData, iPos, numPoints);
      iPos += numPoints*4;
    //Colors
      numColors  =(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      colors = getFloat(streamData, iPos, numColors);
      iPos += numColors*4;
    //Indices
      numIndices =(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24); iPos += 1*4;
      indices = getFloat(streamData, iPos, numIndices);
      iPos += numIndices*4;
    //Matrix
      matrix = getFloat(streamData, iPos, 16);
      iPos += 16*4;

    //Add Object
      //if (vistrails.findObject(filename) == -1){
        aux = new Lines();

        aux.setIsTextured(false);
        aux.setId(iFilename);

        aux.setPoints(points);
        //aux.setNormals(normals);
        aux.setIndexes(indices);
        aux.setColors(colors);
        aux.setTransfMatrix(matrix);
        vistrails.render.objects.list[vistrails.render.objects.count++] = aux;
      //}
    }
    numObjs--;
    if (numObjs == 0){
        setTimeout(finishParse, 10);
    } else {
        setTimeout(parseObject, 10);
    }
    pCurr++;
    document.getElementById("progressBar").innerHTML = "Generating Objects: " + pCurr + " of " + pTotal;
}

var isAnimRunning = false;
finishParse = function(){
    //TODO:Load Background
    grad = String.fromCharCode(streamData[iPos++]);
    vistrails.render.background.isGradient(grad == "Y");

    bgcolors = getFloat(streamData, iPos, 6);
    iPos += 6*4;
    vistrails.render.background.setColor1(bgcolors[0], bgcolors[1], bgcolors[2]);
    vistrails.render.background.setColor2(bgcolors[3], bgcolors[4], bgcolors[5]);
    vistrails.render.background.updateColor()

    for(i=0; i < vistrails.render.objects.count; i++){
        vistrails.render.objects.list[i].createBuffers();
    }
    document.getElementById("progressBar").innerHTML = "";

    isAnimRunning = false;
}

updateProgress = function(evt){
    var percentComplete = (evt.loaded / evt.total)*100;
    document.getElementById("progressBar").innerHTML = "Downloading Data: " + percentComplete + "%";
}

var response="a";
convertData = function(){
    for(i=0; i<response.length; i++) streamData[i] = response.charCodeAt(i)&0xff;

    iPos = 0;
    //TODO:GetCamera
    document.getElementById("progressBar").innerHTML = "Getting Camera Information";
    camera = getFloat(streamData, iPos, 10); //10 with the FOV at the beginning
    vistrails.render.camera.fov = camera[0];
    vistrails.render.camera.eye = [camera[1], camera[2], camera[3]];
    vistrails.render.camera.center = [camera[4], camera[5], camera[6]];
    vistrails.render.camera.up = [camera[7], camera[8], camera[9]];

    iPos += 10*4;
    //GetNumObjs
    numObjs=(streamData[iPos])+(streamData[iPos+1]<<8)+(streamData[iPos+2]<<16)+(streamData[iPos+3]<<24);
    iPos += 1*4;

    pCurr = 0;
    pTotal = numObjs;

    //TODO:Temp - streamData
    setTimeout(parseObject, 10);
}

loadMeshFromFile = function(filename){
    //TODO:Downloading
    document.getElementById("progressBar").innerHTML = "Downloading Data";
    iFilename = filename;
    filename = filename.replace("\\","/")
    filename = filename.replace("\\","/")
    path = "" + filename;
    request = new XMLHttpRequest();
    request.onprogress = updateProgress;

    request.onreadystatechange = function(evt){
        if (request.readyState == 4){
            streamData = [];

            //TODO:Starting Parsing
            document.getElementById("progressBar").innerHTML = "Extracting Binary Data";
            if (evt.srcElement)
                response = evt.srcElement.response;
            else
                response = evt.target.response;
            setTimeout(convertData, 10);
        }
    }
    request.open("GET", path, true);
    request.overrideMimeType("text/plain; charset=x-user-defined");  
    request.send(null);
    return request.responseText;
}

    function Vistrails(){
    }

  Vistrails.prototype.start = function(){
    this.render = new Render();
    this.render.setParentById("vistrailsView")
    this.render.setSize(global_width, global_height);
    this.render.start();

    this.render.interaction.onMouseMove = this.updateCamera;

    this.cameraLocked = false;
    this.lastTranslation = [0,0];
    this.lastRotation = Matrix.I(4);
    this.lastScale = 1.0;

    this.isInSession = false;

    loadMeshFromFile("193_-1.txt");
  }

  Vistrails.prototype.drawLoading = function(){
      context = document.getElementById(vistrails.render.canvasName + "2D").getContext('2d');
      image = document.getElementById("loading");
      context.drawImage(image, 50, 50);
      if (isAnimRunning){
	  setTimeout(vistrails.drawLoading, 1000/60);
      } else {
	  context = document.getElementById(vistrails.render.canvasName + "2D").getContext('2d');
	  context.clearRect (0, 0, vistrails.render.width , vistrails.render.height );
      }
  }



