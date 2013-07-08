/*

Single/double duration widget

arguments: fgred fggreen fgblue bgred bggreen bgblue 

*/

// -------- A class which will represent the object state

var DurationEditor = function() {
	this.sequence = [ 1 ];
	this.seqdur = 1; // total duration
	this.maxlen = 16;

	this.colours = {
		bg: [ 138./255., 155./255., 125./255. ],
		activebg : [ 171./255., 199./255., 149./255. ],
		fg: [ 66./255., 76./255., 58./255. ],
	};
	
	this.dragging = false;
};

DurationEditor.prototype.setColour = function(name, r, g, b) {
	this.colours[name] = [r, g, b];
	this.draw();
	refresh();
};

DurationEditor.prototype.setSequence = function(a) {
	var i, aa=[], l=0;
	for(i=0; i<a.length; i++) {
		if(l < this.maxlen) {
			aa.push(a[i]);
			l += a[i];
		}
	}
	this.sequence = aa;
	this.seqdur = l;
	this.draw();
	refresh();
};

DurationEditor.prototype.randomise = function(dur) {
	var i, aa=[], l=0, v;
	dur = dur ? dur : this.maxlen;
	while (l < dur ) {
		v = (Math.floor(Math.random()*100) % 2) +1;
		if (l+v < maxlen) {
			aa.push(v);
			l += v;
		}
		if (l === dur-1) {
			aa.push(1);
			l += 1;
		}
	}
	this.sequence = aa;
	this.seqdur = l;
	this.draw();
	refresh();
	outlet(0, this.sequence);
};

DurationEditor.prototype.shiftLeft = function() {
	this.sequence.push(this.sequence.shift());
	this.draw();
	refresh();
	outlet(0, this.sequence);
};

DurationEditor.prototype.shiftRight = function() {
	this.sequence.unshift(this.sequence.pop());
	this.draw();
	refresh();
	outlet(0, this.sequence);
};

DurationEditor.prototype.reverse = function() {
	this.sequence.reverse();
	this.draw();
	refresh();
	outlet(0, this.sequence);
};


/* given a cell number, determine which list index occupies this cell, or -1 if none. */
DurationEditor.prototype.listIndexForCell = function(c) {
	var i, a;
	for(i=0, a=0; i<this.sequence.length; i++) {
		if(c>=a && c<a+this.sequence[i]) return i;
		a += this.sequence[i];
	}
	return -1;
};

DurationEditor.prototype.toggleCell = function(c) {
	var li = this.listIndexForCell(c), cur = this.sequence[li];
	if(li>-1) {
		if(cur == 1) {
			if (li<this.sequence.length-1) {
				if(this.sequence[li+1] == 1) {
					// replace '1 1' with 2
					this.sequence.splice(li, 2, 2);
				} else { 
					// replace '1 2' with '2 1'
					this.sequence.splice(li, 2, 2, 1);
				}
			}
		} else if (cur == 2) {
			// replace with 1 1
			this.sequence.splice(li, 1, 1, 1);
		}
	}
	this.draw();
	refresh();
};

DurationEditor.prototype.truncateToDuration = function(d) {
	if(d<1 || d>this.seqdur) return;
	while(this.seqdur > d) {
		this.seqdur -= this.sequence.pop();
	}
	if(this.seqdur < d) {
		this.sequence.push(1);
		this.seqdur += 1;
	}
	this.draw();
	refresh();
};

DurationEditor.prototype.extendToDuration = function(d) {
	if(d>this.maxlen) return;
	for(; this.seqdur<d; this.seqdur++) {
		this.sequence.push(1);
	}
	this.draw();
	refresh();
};

// -- user interface methods

DurationEditor.prototype.draw = function() {
    this.cellwidth = Math.floor(sketch.size[0]/16);
    var axmid = this.seqdur*this.cellwidth/2.0;
    var ymid = Math.ceil(sketch.size[1]/2.0);
    var radius = this.cellwidth/2.0-2.0;
	var i, x, e;
	with(sketch) {
		glclearcolor(this.colours.bg[0], this.colours.bg[1], this.colours.bg[2], 1.0);
		glclear();
		
		glcolor(this.colours.activebg[0], this.colours.activebg[1], this.colours.activebg[2], 1.0);
		moveto(axmid, ymid);
		plane(axmid, ymid, axmid, ymid);
		
		glcolor(this.colours.fg[0], this.colours.fg[1], this.colours.fg[2], 1.0);
		x = 0;
		for (i=0; i<this.sequence.length; i++) {
			e = this.sequence[i];
			if(e==1) {
				moveto(x+(this.cellwidth/2.0), ymid);
				circle(this.cellwidth/2.0-2.0);
			} else if (e==2) {
				moveto(x+this.cellwidth, ymid);
				roundedplane(this.cellwidth/2.0, this.cellwidth-2.0, this.cellwidth/2.0-2.0);
			}
			x += this.cellwidth*e;
		}
		glcolor(0.0, 0.0, 0.0, 0.3);
		moveto(x,0.0);
		lineto(x,sketch.size[1]);
	}
};

DurationEditor.prototype.onclick = function(wx, wy) {
	var fcell = wx/this.cellwidth;
	var cell = Math.floor(fcell);
    if(Math.abs(wx - this.seqdur*this.cellwidth) < 5) {
		this.dragging = true;
	} else {
		this.dragging = false;
		this.toggleCell(cell);
	}
};

DurationEditor.prototype.ondrag = function(wx, wy) {
	if(this.dragging) {
		var fcell = Math.round(wx/this.cellwidth);
		if(fcell < this.seqdur) {
			this.truncateToDuration(fcell);
		} else if (fcell > this.seqdur) {
			this.extendToDuration(fcell);
		}	
	}
};

DurationEditor.prototype.onmouseup = function(wx, wy) {
	this.dragging = 0;
	outlet(0, this.sequence);
};

var widget = new DurationEditor();

sketch.default2d();
with(sketch) {
    glmatrixmode("projection");
    glloadidentity();
    glortho(-0.5, size[0]-0.5, size[1]-0.5, -0.5, -1,100.);
}

var sequence = [ 1, 2 ];
var seqlen = 3;
var maxlen = 16;

draw();

// Relay events to our widget

function draw()
{
	widget.draw();
}

function bang()
{
	outlet(0, widget.sequence);
}

function msg_int(i)
{
	var a = [i];
	widget.setSequence(a);
}

function list() 
{
	var a = arrayfromargs(arguments);
	widget.setSequence(a);
}

function randomise(v) { widget.randomise(v); }
function left() { widget.shiftLeft(); }
function right() { widget.shiftRight(); }
function reverse() { widget.reverse(); }

function fgrgb(r,g,b)
{
	widget.setColour('fg', r/255., g/255., b/255.);
}

function bgrgb(r,g,b)
{
	widget.setColour('bg', r/255., g/255., b/255.);
}

function activebgrgb(r,g,b)
{
	widget.setColour('activebg', r/255., g/255., b/255.);
}

// all mouse events are of the form: 
// onevent <x>, <y>, <button down>, <cmd(PC ctrl)>, <shift>, <capslock>, <option>, <ctrl(PC rbutton)>
// if you don't care about the additonal modifiers args, you can simply leave them out.
// one potentially confusing thing is that mouse events are in absolute screen coordinates, 
// with (0,0) as left top, and (width,height) as right, bottom, while drawing 
// coordinates are in relative world coordinates, with (0,0) as the center, +1 top, -1 bottom,
// and x coordinates using a uniform scale based on the y coordinates. to convert between screen 
// and world coordinates, use sketch.screentoworld(x,y) and sketch.worldtoscreen(x,y,z).

function onclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	var world = sketch.screentoworld(x,y);
	widget.onclick(world[0], world[1]);
}
onclick.local = 1; //private. could be left public to permit "synthetic" events

function ondrag(x,y,but,cmd,shift,capslock,option,ctrl)
{
	var world = sketch.screentoworld(x,y);
	if(but) {
		widget.ondrag(world[0], world[1]);
	} else {
		widget.onmouseup(world[0], world[1]);
	}
}
ondrag.local = 1; //private. could be left public to permit "synthetic" events

/*function ondblclick(x,y,but,cmd,shift,capslock,option,ctrl)
{
	last_x = x;
	last_y = y;
	msg_float(0); // reset dial?
}
ondblclick.local = 1; //private. could be left public to permit "synthetic" events
*/
function forcesize(w,h)
{
	if (w<h) {
		w = h;
		box.size(w,h);
	}
}
forcesize.local = 1; //private

function onresize(w,h)
{
	forcesize(w,h);
	draw();
	refresh();
}
onresize.local = 1; //private
