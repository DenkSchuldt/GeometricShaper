
// THRESHOLD
var CIRCLE_VARIANCE_MAX = 40;
var CIRCLE_VARIANCE_MIN = 2;

// Variables
var point;
var paint;
var context;
var main_color;
var line_height;
var dist_prom = 0;
var figura_cerrada = false;
var points = new Array();
var corners = new Array();
var resampledPoints = new Array();



function isConvex(){
	if (corners.length == 3){
		var normalZ1 = getNormalZ(corners[0], corners[1], corners[2]);
		var normalZ2 = getNormalZ(corners[2], corners[0], corners[1]);
		var normalZ3 = getNormalZ(corners[1], corners[2], corners[0]);
		if((normalZ1 > 0 && normalZ2 > 0 && normalZ3 > 0) || (normalZ1 < 0 && normalZ2 < 0 && normalZ3 < 0)){
			return true;
		}
		
	}else if(corners.length == 4){
		var normalZ1 = getNormalZ(corners[0], corners[1], corners[2]);
		var normalZ2 = getNormalZ(corners[1], corners[2], corners[3]);
		var normalZ3 = getNormalZ(corners[3], corners[0], corners[1]);
		var normalZ4 = getNormalZ(corners[2], corners[3], corners[0]);
		if((normalZ1 > 0 && normalZ2 > 0 && normalZ3 > 0 && normalZ4 > 0) || (normalZ1 < 0 && normalZ2 < 0 && normalZ3 < 0 && normalZ4 < 0)){
			return true;
		}
	}
	
	return false;
}

/**
 *
 */
function getCorners() {
    corners = new Array();
	corners.push(resampledPoints[0]);
	for (i = 1; i < resampledPoints.length - 1; i++) {
		var p1 = newPoint(resampledPoints[i-1].x, resampledPoints[i-1].y);
		var p2 = newPoint(resampledPoints[i].x, resampledPoints[i].y);
		var p3 = newPoint(resampledPoints[i+1].x, resampledPoints[i+1].y);
		var v1 = newPoint(p2.x - p1.x, p2.y - p1.y);
		var v2 = newPoint(p3.x - p2.x, p3.y - p2.y);
		var dot_product = Math.acos((v1.x*v2.x + v1.y*v2.y)/(Math.sqrt(v1.x*v1.x + v1.y*v1.y)*Math.sqrt(v2.x*v2.x + v2.y*v2.y)))* (180/Math.PI);
		if (dot_product > 90){
		  dot_product = 180 - dot_product;
		}
		distancia_punto_anterior = getDistance(corners[corners.length-1], resampledPoints[i]);
		if(dot_product > 35 && distancia_punto_anterior > 5*dist_prom) {
			var point = newPoint(resampledPoints[i].x, resampledPoints[i].y);
			corners.push(point);
		}
	}
	if(corners.length > 2){
		if (!isConvex()){
			corners = new Array();
		}
	}
}

/**
 *
 */
function isCircle() {
  var radiuses = new Array();
  point = newPoint(0,0);
  for (var i = 0; i < resampledPoints.length; i++) {
    point.x += resampledPoints[i].x;
    point.y += resampledPoints[i].y;
  }
  point.x = point.x/resampledPoints.length;
  point.y = point.y/resampledPoints.length;
  for (var i = 0; i < resampledPoints.length; i++) {
    radiuses.push(getDistance(point, resampledPoints[i]));
  }
  var variance = Math.pow(math.std(radiuses), 2);
  if (variance > CIRCLE_VARIANCE_MIN && variance < CIRCLE_VARIANCE_MAX) {
    return true;
  }
  return false;
}

/**
 *
 */
function resample(resample_number) {
  var distanciaTotal = 0; //Distancia total del trazo
  var distanciaPromedio = 0; //distancia promedio para equi-espaciar los puntos
  var distancia = 0; //distancia entre 2 puntos
  var distanciaAvance = 0; //distancia acumulada en el resampling
  resampledPoints = new Array();

  for (i = 1; i < points.length; i++) {
    distanciaTotal += getDistance(points[i-1], points[i]);
  }

  distanciaPromedio = distanciaTotal/(resample_number - 1);
  dist_prom = distanciaPromedio;

  resampledPoints.push(points[0]);

  for (i = 1; i < points.length; i++) {
    distancia = getDistance(points[i-1], points[i]);
    if( (distanciaAvance + distancia) >= distanciaPromedio ) {
      var resampledPoint = newPoint(0, 0);
      resampledPoint.x = points[i-1].x + ((distanciaPromedio - distanciaAvance)/distancia)*(points[i].x-points[i-1].x);
      resampledPoint.y = points[i-1].y + ((distanciaPromedio - distanciaAvance)/distancia)*(points[i].y-points[i-1].y);
      resampledPoints.push(resampledPoint);
      points.splice(i, 0, resampledPoint);
      distanciaAvance = 0;
    } else {
      distanciaAvance += distancia;
    }
  }

  if(resampledPoints.length < resample_number){
    resampledPoints.push(points[points.length-1]);
  }

  if(getDistance(points[0], points[points.length-1]) < 3*distanciaPromedio){
	   figura_cerrada = true;
  } else {
	   figura_cerrada = false;
  }
}

/**
 *
 */
function redraw(src) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.strokeStyle = main_color;
  context.lineWidth = 1;
  switch (src) {
    case 1:
      for(var i=0; i < points.length; i++) {
        context.beginPath();
        context.arc(points[i].x,points[i].y,1,0,2*Math.PI);
        context.fillStyle = main_color;
        context.fill();
        context.closePath();
        context.stroke();
      }
      break;
    case 2:
        var previousPoint;
      for(var i=0; i < resampledPoints.length; i++) {
        var currentPoint = resampledPoints[i];
        if (i > 0) {
          context.beginPath();
          context.lineWidth = line_height;
          context.moveTo(previousPoint.x, previousPoint.y);
          context.lineTo(currentPoint.x, currentPoint.y);
          context.closePath();
        }
        context.stroke();
        previousPoint = currentPoint;
      }
      break;
  }
}

function recircle(){
  var radius;
  var newCircle = new Array();
  radius = getDistance(point, resampledPoints[0]);
  for (var i = 0; i < 64; i++) {
    var pct = (i + 1) / 64;
    var theta = pct * Math.PI * 2.0;
    var x = (radius * Math.cos(theta)) + point.x;
    var y = (radius * Math.sin(theta)) + point.y;
    var circlePoint = newPoint(x,y);
    newCircle.push(circlePoint);
  }
  resampledPoints = newCircle;
  resampledPoints.push(newCircle[0]);
}

/**
 *
 */
$('#canvas_2d').on("touchstart", function(e){
  clearOptions();
  closeMenuOptions();
  paint = true;
  points = new Array();
  var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
  var offset = $(this).offset();
  var relX = touch.pageX - offset.left;
  var relY = touch.pageY - offset.top;
  var point = newPoint(relX, relY);
  points.push(point);
  redraw(1);
});

/**
 *
 */
$('#canvas_2d').on("touchmove", function(e){
  if(paint) {
    var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0];
    var offset = $(this).offset();
    var relX = touch.pageX - offset.left;
    var relY = touch.pageY - offset.top;
    var point = newPoint(relX, relY);
    points.push(point);
    redraw(1);
  }
});


/**
 *
 */
$('#canvas_2d').mousedown(function(e) {
  clearOptions();
  closeMenuOptions();
  paint = true;
  points = new Array();
  var offset = $(this).offset();
  var relX = e.pageX - offset.left;
  var relY = e.pageY - offset.top;
  var point = newPoint(relX, relY);
  points.push(point);
  redraw(1);
});

/**
 *
 */
$('#canvas_2d').mousemove(function(e) {
  if(paint) {
    var offset = $(this).offset();
    var relX = e.pageX - offset.left;
    var relY = e.pageY - offset.top;
    var point = newPoint(relX, relY);
    points.push(point);
    redraw(1);
  }
});

/**
 *
 */
$('#canvas_2d').on("mouseup touchend", function(e){
  paint = false;
  resample(64);
  getCorners();
  if (isCircle()) {
    recircle();
    redraw(2);
    showCircleOption();
  } else if(corners.length == 3 && figura_cerrada) {
    resampledPoints = corners;
    resampledPoints.push(corners[0]);
    redraw(2);
    showTriangleOptions();
  } else if(corners.length == 4 && figura_cerrada) {
    resampledPoints = corners;
    resampledPoints.push(corners[0]);
    redraw(2);
    showQuadrangleOptions();
  } else {
    redraw(2);
    deleteObject();
  }
  lastPoint = resampledPoints[resampledPoints.length-1];
  if (lastPoint) {
    $('#options').css('top', lastPoint.y+'px');
    $('#options').css('left', lastPoint.x+'px');
    if ((lastPoint.x + $('#options').width()) > $(window).width()) {
      $('#options').css('left', ($(window).width()-$('#options').width())+'px');
    }
    if ((lastPoint.y + $('#options').height()) > $(window).height()) {
      $('#options').css('top', ($(window).height()-$('#options').height())+'px');
    }
  }
});

/**
 *
 */
function clearCanvas2D(){
	points = new Array();
	resampledPoints = new Array();
	redraw(1);
}


/**
 *
 */
function init() {
  line_height = 4;
  main_color = "#F44336";
  context = document.getElementById('canvas_2d').getContext("2d");
  $("#canvas_2d").attr("width", $("#canvas_2d").width());
  $("#canvas_2d").attr("height", $("#canvas_2d").height());
  window.addEventListener('resize', function() {
    $("#canvas_2d").attr("width", $("#canvas_2d").width());
    $("#canvas_2d").attr("height", $("#canvas_2d").height());
    redraw(2);
  });
}

init();
