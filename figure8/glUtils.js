/**********************
* Based on the glUtils found in learningwebgl.com
* Its creation is associated to Vladimir Vukicevic - Mozilla
* Set of utils methods as well as some extensions to Sylvester.js
* Sylvester.js is an OpenSource library for doing matrix and vector algebra in JS
*
* Methods:
* - Matrix.loadidentify()
* - Matrix.Scale()
* - Matrix.Translation()
* - Matrix.flatten()
* - Matrix.ensure4x4()
* - Matrix.make3x3()
* - Vector.flatten()
* - mht()
* - makeLookAt()
* - makePerspective() 
* - makeFrustum()
* - makeOrtho()
**********************/

// Camera Rotation
var glu = new function(){

  this.makeOrtho = function(left, right, bottom, top, znear, zfar){
      var tx = - (right + left) / (right - left);
      var ty = - (top + bottom) / (top - bottom);
      var tz = - (zfar + znear) / (zfar - znear);

      return $M([[2 / (right - left), 0, 0, tx],
             [0, 2 / (top - bottom), 0, ty],
             [0, 0, -2 / (zfar - znear), tz],
             [0, 0, 0, 1]]);
  }

  this.makeFrustum = function(left, right, bottom, top, znear, zfar){
    var w = (right-left);
    var h = (top-bottom);

    var X = 2*znear/w;
    var Y = 2*znear/h;
    var A = (right+left)/w;
    var B = (top+bottom)/h;
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
  }

  this.makePerspective = function(fovy, aspect, znear, zfar){
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;
    return this.makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
  }

  this.makeLookAt = function(ex, ey, ez, cx, cy, cz, ux, uy, uz)
  {
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
  }

  this.cameraRotation = function(ex, ey, ez, cx, cy, cz, ux, uy, uz){
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    return m;
  }
}

Matrix.Scale = function(v){
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[0][0] = v.elements[0];
    r.elements[1][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][0] = v.elements[0];
    r.elements[1][1] = v.elements[1];
    r.elements[2][2] = v.elements[2];
    return r;
  }

  throw "Invalid length for Scale";
}

Matrix.Translate = function(v){
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.prototype.ensure4x4 = function(){
  if (this.elements.length == 4 && this.elements[0].length == 4) return this;

  if (this.elements.length > 4 || this.elements[0].length > 4) return null;

  for (var i = 0; i < this.elements.length; i++) {
    for (var j = this.elements[i].length; j < 4; j++) {
      if (i == j) this.elements[i].push(1);
      else this.elements[i].push(0);
    }
  }

  for (var i = this.elements.length; i < 4; i++) {
    if (i == 0) this.elements.push([1, 0, 0, 0]);
    else if (i == 1) this.elements.push([0, 1, 0, 0]);
    else if (i == 2) this.elements.push([0, 0, 1, 0]);
    else if (i == 3) this.elements.push([0, 0, 0, 1]);
  }

  return this;
};

Matrix.prototype.flatten = function (){
  var result = [];
  if (this.elements.length == 0) return [];
  var count = 0;

  for (var j = 0; j < this.elements[0].length; j++)
    for (var i = 0; i < this.elements.length; i++)
      result.push(this.elements[i][j]);
  return result;
}
/*
//Load Identify
Matrix.loadIdentity = function () {
  return Matrix.I(4);
}

Matrix.prototype.make3x3 = function()
{
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.flatten = function ()
{
    return this.elements;
};

function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}

// Transpose
Matrix.prototype.transpose = function(){
    return Matrix.create([[this.elements[0][0], this.elements[1][0], this.elements[2][0], this.elements[3][0]],
                          [this.elements[0][1], this.elements[1][1], this.elements[2][1], this.elements[3][1]],
                          [this.elements[0][2], this.elements[1][2], this.elements[2][2], this.elements[3][2]],
                          [this.elements[0][3], this.elements[1][3], this.elements[2][3], this.elements[3][3]]]);
}

*/
