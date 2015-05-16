

var canvas;
var gl;

var numVertices  = 36;

var program;

var pointsArray = [];
var texCoordsArray = [];

// camera/perspective information
var eye = vec3(0.0,0.0,-5.0);
var at = vec3(0.0,0.0,0.0);
const up = vec3(0.0, 1.0, 0.0);
var fovy = 45;
var aspect;
var near = 0.3;
var far = 100;

var image, image2;
var texture;

// texture information
var texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

var texCoordHalf = [
    vec2(-0.5, -0.5),
    vec2(-0.5, 1.5),
    vec2(1.5, 1.5),
    vec2(1.5, -0.5)
];

// cube geometry
var vertices = [
    vec4( -0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5,  0.5,  0.5, 1.0 ),
    vec4( 0.5, -0.5,  0.5, 1.0 ),
    vec4( -0.5, -0.5, -0.5, 1.0 ),
    vec4( -0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5,  0.5, -0.5, 1.0 ),
    vec4( 0.5, -0.5, -0.5, 1.0 )
];

// rotation information
var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var theta = [0.0, 0.0, 0.0];
var halfTheta = [0.0, 0.0, 0.0];
var textureTheta = 0.0;
var diff = 0.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var transformMatrix, transformMatrixLoc;
var textureMatrix, textureMatrixLoc;
var thetaLoc;

var iFrequency = 16;
var myInterval = 0;

var half = 0;

// set if cubes/textures are moving
var rotation = 1;
var textureRotation = 0;
var textureScrolling = 0;


// load textures and filter based on which cube its going onto
function configureTexture( image ) {
    texture = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    gl.generateMipmap( gl.TEXTURE_2D );
	if (half == 1){
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
						  gl.LINEAR_MIPMAP_LINEAR );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR );
	}
	else{
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
						  gl.NEAREST_MIPMAP_NEAREST );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
	}		
    gl.uniform1i(gl.getUniformLocation(program, "texture"), 0);
}

// draws a quadrilateral shape and sends texCoords based on which cube its for
function quad(a, b, c, d) {
	
	pointsArray.push(vertices[a]); 
	pointsArray.push(vertices[b]); 
	pointsArray.push(vertices[c]); 
	pointsArray.push(vertices[a]); 
	pointsArray.push(vertices[c]); 
	pointsArray.push(vertices[d]); 
	
	if (half == 0){
		texCoordsArray.push(texCoord[0]);   
		texCoordsArray.push(texCoord[1]);   
		texCoordsArray.push(texCoord[2]);   
		texCoordsArray.push(texCoord[0]);   
		texCoordsArray.push(texCoord[2]);  
		texCoordsArray.push(texCoord[3]);  
	}
	else{
		texCoordsArray.push(texCoordHalf[0]);   
		texCoordsArray.push(texCoordHalf[1]);   
		texCoordsArray.push(texCoordHalf[2]);   
		texCoordsArray.push(texCoordHalf[0]);   
		texCoordsArray.push(texCoordHalf[2]);  
		texCoordsArray.push(texCoordHalf[3]); 
	}
	 
}

// draw a Cube
function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}


window.onload = function init() {
	
	// set up WebGL
    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);
	aspect = canvas.width/canvas.height;
	
	animate();
	
	// load the Cubes' geometry

	// first cube, full texture
	half = 0;
    colorCube();
	// second cube, half texture
	half = 1;
	colorCube();

    //
    //  Load shaders and initialize attribute buffers
    //

    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
	
    var vBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW );
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    var tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(texCoordsArray), gl.STATIC_DRAW );
    
    var vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );

	//
	// send variables and matrices to the shaders
	//
    thetaLoc = gl.getUniformLocation(program, "theta"); 
	modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	transformMatrixLoc = gl.getUniformLocation( program, "transformMatrix");
	textureMatrixLoc = gl.getUniformLocation( program, "textureMatrix");
	thetaLoc = gl.getUniformLocation(program, "theta"); 
	
	// set up projection + modelview matrices
	projectionMatrix = perspective(fovy, aspect, near, far);
	modelViewMatrix = lookAt(eye, at , up);
	
	// get the images from the html
	image = document.getElementById("texImage");
	image2 = document.getElementById("texImage2");

	getInput();
    render();
 
}

// smoothly animate based on 1/60s time, not frames
function animate() {
    if(myInterval > 0) clearInterval(myInterval);
	myInterval = setInterval( "doSomething()", iFrequency );
}


function doSomething()
{
	if(rotation == 1){              // for cube rotations
		theta[yAxis]+=1;
		halfTheta[xAxis] += 0.5;
	}
	if(textureRotation == 1){       // for texture rotations
		textureTheta += 1.5;
	}
	if(textureScrolling == 1){      // for texture scrolling
		diff+= 0.01;
		if (diff == 1.0) //reset texture coordinates on repeats
			diff = 0.0;
	}	
}  

var render = function(){
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


	gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
	gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
	
	//
	// draw first cube, making proper transforms for position + texture
	//
	half = 0;
	configureTexture( image ); // load the first texture
	transformMatrix = mult(translate(1.4,0.0,0.0),scale(1.5,1.5,1.5));
	var a  = rotate(textureTheta, vec3(0.0,0.0,1.0));
	var b = translate(-0.5,-0.5,0.0);
	textureMatrix = mult(mult(b,a),b);
	gl.uniformMatrix4fv( transformMatrixLoc, false, flatten(transformMatrix) );
	gl.uniformMatrix4fv( textureMatrixLoc, false, flatten(textureMatrix) );
	gl.uniform3fv(thetaLoc, flatten(theta));
    gl.drawArrays( gl.TRIANGLES, 0, numVertices );

	//
	// draw first cube, making proper transforms for position + texture
	//
	half = 1;
	configureTexture( image2 ); // load the second texture
	transformMatrix = translate(-1.4,0.0,0.0);
	textureMatrix = translate(diff,-diff,0);
	gl.uniformMatrix4fv( transformMatrixLoc, false, flatten(transformMatrix) );
	gl.uniformMatrix4fv( textureMatrixLoc, false, flatten(textureMatrix) );
	gl.uniform3fv(thetaLoc, flatten(halfTheta));
    gl.drawArrays( gl.TRIANGLES, numVertices, numVertices );
   
    requestAnimFrame(render);
}

function getInput()
{
	//get input for keyboard functions
	document.addEventListener('keydown', function(event) {
		if (event.keyCode == 73) {
		 //   i key, move camera forward (objects towards camera actually)
			modelViewMatrix = mult(translate(0.0,0.0,0.25), modelViewMatrix);
		//moveAll(vec4(0.0,0.0,-0.25,0.0));
		}	
		else if (event.keyCode == 79) {
		 //   o key move camera backward (objects away from camera actually)
			modelViewMatrix = mult(translate(0.0,0.0,-0.25), modelViewMatrix);
		}
		else if (event.keyCode == 82) {
		 //   r key , start and stop both cubes' rotations
			rotation = !rotation;
		}
		else if (event.keyCode == 84) {
		 //   t key , start and stop first cube's texture rotations
			textureRotation = !textureRotation;
		}
		else if (event.keyCode == 83) {
		 //   s key, start and stop second cube's texture scrolling
			textureScrolling = !textureScrolling;
		}

	}, true);
}