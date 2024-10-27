/*

gamepad viz

*/
autowatch = 1;

var top_inner = 			[ 0.45, 0.2 ];
var top_outer = 			[ 0.35, 0.2 ];
var handle_upper_outer = 	[ 0.2, 0.25 ];
var handle_lower_outer = 	[ 0.1, 0.8 ];
var handle_tip_outer = 		[ 0.1, 0.9 ];
var handle_tip_inner = 		[ 0.2, 0.9 ];
var handle_lower_inner = 	[ 0.25, 0.85 ];
var handle_upper_inner =  	[ 0.3, 0.75 ];
var bottom_outer = 			[ 0.35, 0.7 ];
var bottom_inner = 			[ 0.45, 0.7 ];

// these colors updated in paint method to match themes
// if you'd like to change them, you'll need to handle in paint too
var _fgcolor = this.patcher.getattr("textcolor");
var _bgcolor = this.patcher.getattr("locked_bgcolor");
var _drawbg = 1;
var _linewidth = 3;
var _font_size = 10.;
var _press_alpha = 0.7;

var _state = {};

function clear() 
{
	for (k in _state) {
		_state[k].val = 0;
		_state[k].press = 0;
	}
}

function anything() 
{
	setstate(messagename, arguments[0]);	
}

function setstate(name, val)
{
	if (!_state[name]) {
		_state[name] = {};
		_state[name].val = val;
		_state[name].press = (val == 1);
	} else {
		 // draw presses even if released before next draw
		if (val == 1 && _state[name].val == 0) {
			_state[name].press = true;
		}
		_state[name].val = val;
	}
	mgraphics.redraw();
}

function touchpad_generic(touchpad, finger, x, y, pressure) 
{
	var name = "touch_finger0";

	if (finger > 0) {
		name = "touch_finger1";
	} 
	
	setstate(name + "_x", x);
	setstate(name + "_y", y);
	setstate(name + "_pressure", pressure);
}

function touchpad_up(touchpad, finger, x, y, pressure) 
{
	touchpad_generic(touchpad, finger, x, y, pressure);
}

function touchpad_down(touchpad, finger, x, y, pressure) 
{
	touchpad_generic(touchpad, finger, x, y, pressure);
}

function touchpad_motion(touchpad, finger, x, y, pressure) 
{
	touchpad_generic(touchpad, finger, x, y, pressure);
}

mgraphics.init();
mgraphics.autofill = 0;
mgraphics.relative_coords = 1;

mgraphics.redraw();


function adjust_left(coords, aspect)
{
	var adjusted = new Array(2);

	adjusted[0] = -aspect + (coords[0] * aspect * 2.);
	adjusted[1] = 1. - (coords[1] * 2.);

	return adjusted;
}

function adjust_right(coords, aspect)
{
	var adjusted = new Array(2);

	adjusted[0] = aspect - (coords[0] * aspect * 2.);
	adjusted[1] = 1. - (coords[1] * 2.);

	return adjusted;
}

function scalar_mix(a, b, amount)
{
	return a*(1-amount) + (b*amount);
}

function point_mix(a, b, amount)
{
	var output = new Array(2);
	output[0] = scalar_mix(a[0], b[0], amount);
	output[1] = scalar_mix(a[1], b[1], amount);
	return output;
}

function curve_helper(first, second, third, amount)
{
	var point1 = point_mix(second, first, amount);
	var point3 = point_mix(second, third, amount);;
	mgraphics.curve_to(point1, second, point3);
}

function joy_helper(name, diameter, offset_x, offset_y, scale)
{
	var x = 0.;
	var y = 0.;

	if (_state["axis_" + name + "_x"]) {
		x = _state["axis_" + name + "_x"].val;
	}
	if (_state["axis_" + name + "_y"]) {
		y = _state["axis_" + name + "_y"].val;
	}

	// clip to circle
	var r = Math.sqrt(x*x + y*y);
    var theta = Math.atan2(y, x);
	if (r > 1.) {
		r = 1.;
	}
	x = r * Math.cos(theta);
	y = r * Math.sin(theta);

	scale = scale - diameter/2;
	var top = offset_y + (scale * y) + diameter/2;
	var left = offset_x + (scale * x) - diameter/2;

	mgraphics.ellipse(left, top, diameter, diameter);
	button_stroke("button_" + name + "_stick");
}

function touch_helper(name, diameter, offset_x, offset_y, width, height)
{
	var x = 0;
	var y = 0;
	var pressure = 0;
	var dodraw = 0;
	var name_x = "touch_" + name + "_x";
	var name_y = "touch_" + name + "_y";
	var name_p = "touch_" + name + "_pressure";
	
	if (_state[name_p]) {
		pressure = _state[name_p].val;
		var press = _state[name_p].press;
		_state[name_p].press = false;
		dodraw = pressure > 0 || press;
	}

	if (dodraw) {
		var scale_x = width - diameter;
		var scale_y = height - diameter;

		x = _state[name_x].val;
		y = _state[name_y].val;

		var top = offset_y - (scale_y * y);
		var left = offset_x + (scale_x * x);
	
		mgraphics.ellipse(left, top, diameter, diameter);
		mgraphics.stroke();

		var inset = 0.3;
		if (name == "finger1") {
			var middle = left + diameter/2;
			mgraphics.move_to(middle, top - (inset * diameter));
			mgraphics.line_to(middle, top - ((1 - inset) * diameter));
		} else {
			var in_diameter = diameter * (1 - (2 * inset));
			mgraphics.ellipse(left + (inset * diameter), top - (inset * diameter), in_diameter, in_diameter);
			mgraphics.stroke();
		}
	}
}

function joy_text(name, pos_x, pos_y) 
{
	var x = 0.;
	var y = 0.;

	if (_state["axis_" + name + "_x"]) {
		x = _state["axis_" + name + "_x"].val;
	}
	if (_state["axis_" + name + "_y"]) {
		y = _state["axis_" + name + "_y"].val;
	}

	mgraphics.move_to(pos_x, pos_y);
	mgraphics.show_text("X: " + x.toFixed(3));
	mgraphics.move_to(pos_x, pos_y-0.1);	
	mgraphics.show_text("Y: " + y.toFixed(3));
}

function trigger_text(name, pos_x, pos_y, label) 
{
	var val = 0.;
	var y = 0.;

	if (_state["axis_" + name + "_trigger"]) {
		val = _state["axis_" + name + "_trigger"].val;
	}

	if (val > 0) {
		mgraphics.move_to(pos_x, pos_y);
		mgraphics.show_text(label + ": " + val.toFixed(3));
	}
}

function touch_text(name, pos_x, pos_y, label) 
{
	var x = 0.;
	var y = 0.;
	var pressure = 0;

	if (_state["touch_" + name + "_x"]) {
		x = _state["touch_" + name + "_x"].val;
	}
	if (_state["touch_" + name + "_y"]) {
		y = _state["touch_" + name + "_y"].val;
	}
	if (_state["touch_" + name + "_pressure"]) {
		pressure = _state["touch_" + name + "_pressure"].val;
	}

	if (pressure) {
		mgraphics.move_to(pos_x, pos_y);
		mgraphics.show_text("X" + label + ": " + x.toFixed(3));
		mgraphics.move_to(pos_x, pos_y-0.1);	
		mgraphics.show_text("Y" + label + ": " + y.toFixed(3));
	}
}

function button_stroke(name)
{
	if (_state[name] && (_state[name].val || _state[name].press)) {
		_state[name].press = false;
		mgraphics.set_source_rgba(_fgcolor[0], _fgcolor[1], _fgcolor[2], _press_alpha);
		mgraphics.fill_preserve();
		mgraphics.set_source_rgba(_fgcolor);		
		mgraphics.stroke();
	} else {
		mgraphics.stroke();
	}
}

function paint()
{
	_fgcolor = this.patcher.getattr("textcolor");
	_bgcolor = this.patcher.getattr("locked_bgcolor");
	
	var viewsize = mgraphics.size;
	var width = viewsize[0];
	var height = viewsize[1];
	var width, height;
	var aspect = width/height;

	var l_top_inner = adjust_left(top_inner, aspect);
	var l_top_outer = adjust_left(top_outer, aspect);
	var l_handle_upper_outer = adjust_left(handle_upper_outer, aspect);
	var l_handle_lower_outer = adjust_left(handle_lower_outer, aspect);
	var l_handle_tip_outer = adjust_left(handle_tip_outer, aspect);
	var l_handle_tip_inner = adjust_left(handle_tip_inner, aspect);
	var l_handle_lower_inner = adjust_left(handle_lower_inner, aspect);
	var l_handle_upper_inner = adjust_left(handle_upper_inner, aspect);
	var l_bottom_outer = adjust_left(bottom_outer, aspect);
	var l_bottom_inner = adjust_left(bottom_inner, aspect);
	
	var r_top_inner = adjust_right(top_inner, aspect);
	var r_top_outer = adjust_right(top_outer, aspect);
	var r_handle_upper_outer = adjust_right(handle_upper_outer, aspect);
	var r_handle_lower_outer = adjust_right(handle_lower_outer, aspect);
	var r_handle_tip_outer = adjust_right(handle_tip_outer, aspect);
	var r_handle_tip_inner = adjust_right(handle_tip_inner, aspect);
	var r_handle_lower_inner = adjust_right(handle_lower_inner, aspect);
	var r_handle_upper_inner = adjust_right(handle_upper_inner, aspect);
	var r_bottom_outer = adjust_right(bottom_outer, aspect);
	var r_bottom_inner = adjust_right(bottom_inner, aspect);
	
	if (_drawbg) {
		mgraphics.set_source_rgba(_bgcolor);
		mgraphics.rectangle(-aspect, 1, aspect*2, 2);
		mgraphics.fill();
	}	
	
	mgraphics.set_line_width(_linewidth/height);
	mgraphics.set_font_size(_font_size * height/256);
	
	// just used for debugging
	var outline = 0;
	if (outline) {
		mgraphics.set_source_rgba(1., 1., 1., 1.);
		mgraphics.move_to(l_top_inner);
		mgraphics.line_to(l_top_outer);
		mgraphics.line_to(l_handle_upper_outer);
		mgraphics.line_to(l_handle_lower_outer);
		mgraphics.line_to(l_handle_tip_outer);
		mgraphics.line_to(l_handle_tip_inner);
		mgraphics.line_to(l_handle_lower_inner);
		mgraphics.line_to(l_handle_upper_inner);
		mgraphics.line_to(l_bottom_outer);
		mgraphics.line_to(l_bottom_inner);

		mgraphics.line_to(r_bottom_inner);
		mgraphics.line_to(r_bottom_outer);
		mgraphics.line_to(r_handle_upper_inner);
		mgraphics.line_to(r_handle_lower_inner);
		mgraphics.line_to(r_handle_tip_inner);
		mgraphics.line_to(r_handle_tip_outer);
		mgraphics.line_to(r_handle_lower_outer);
		mgraphics.line_to(r_handle_upper_outer);
		mgraphics.line_to(r_top_outer);
		mgraphics.line_to(r_top_inner);

		mgraphics.line_to(l_top_inner);
		
		mgraphics.stroke();
	}

	var curve = 0.5;
	mgraphics.set_source_rgba(_fgcolor);
	mgraphics.move_to(l_top_inner);
	curve_helper(r_top_outer, l_top_inner, l_top_outer, curve);
	curve_helper(l_top_inner, l_top_outer, l_handle_upper_outer, curve);
	curve_helper(l_top_outer, l_handle_upper_outer, l_handle_lower_outer, curve);
	curve_helper(l_handle_upper_outer, l_handle_lower_outer, l_handle_tip_outer, curve);
	curve_helper(l_handle_lower_outer, l_handle_tip_outer, l_handle_tip_inner, curve);
	curve_helper(l_handle_tip_outer, l_handle_tip_inner, l_handle_lower_inner, curve);
	curve_helper(l_handle_tip_inner, l_handle_lower_inner, l_handle_upper_inner, curve);
	curve_helper(l_handle_lower_inner, l_handle_upper_inner, l_bottom_outer, curve);
	curve_helper(l_handle_upper_inner, l_bottom_outer, l_bottom_inner, curve);

	curve_helper(l_bottom_outer, l_bottom_inner, r_bottom_inner, curve);
	curve_helper(l_bottom_inner, r_bottom_inner, r_bottom_outer, curve);
	
	curve_helper(r_bottom_inner, r_bottom_outer, r_handle_upper_inner, curve);	
	curve_helper(r_bottom_outer, r_handle_upper_inner, r_handle_lower_inner, curve);	
	curve_helper(r_handle_upper_inner, r_handle_lower_inner, r_handle_tip_inner, curve);	
	curve_helper(r_handle_lower_inner, r_handle_tip_inner, r_handle_tip_outer, curve);	
	curve_helper(r_handle_tip_inner, r_handle_tip_outer, r_handle_lower_outer, curve);	
	curve_helper(r_handle_tip_outer, r_handle_lower_outer, r_handle_upper_outer, curve);	
	curve_helper(r_handle_lower_outer, r_handle_upper_outer, r_top_outer, curve);	
	curve_helper(r_handle_upper_outer, r_top_outer, r_top_inner, curve);	
	curve_helper(r_top_outer, r_top_inner, l_top_inner, curve);
	mgraphics.line_to(l_top_inner);

	//mgraphics.fill();
	mgraphics.stroke();

	// touchpad
	var inset = 0.075;
	var rounded = 0.1;
	var touchpad_left = l_top_outer[0] + inset;
	var touchpad_top = l_top_outer[1] - inset;
	var touchpad_right = r_top_outer[0] - inset;
	var touchpad_width =  touchpad_right - touchpad_left;
	var touchpad_height = 0.425;
	var touchpad_bottom = touchpad_top - touchpad_height;
	
	mgraphics.rectangle_rounded(touchpad_left, touchpad_top, touchpad_width, touchpad_height, rounded, rounded);
	button_stroke("button_touchpad");
	touch_helper("finger0", 0.1, touchpad_left, touchpad_top, touchpad_width, touchpad_height)
	touch_helper("finger1", 0.1, touchpad_left, touchpad_top, touchpad_width, touchpad_height)

	// joy sticks
	var left_joy_left = touchpad_left - 0.15;
	var left_joy_top = touchpad_bottom - 0.075;
	var joy_diameter = 0.35;

	mgraphics.ellipse(left_joy_left, left_joy_top, joy_diameter, joy_diameter);
	mgraphics.stroke();

	joy_helper("left", joy_diameter/3, left_joy_left+joy_diameter/2, left_joy_top-joy_diameter/2, joy_diameter/2);

	var right_joy_left = touchpad_right + 0.15 - joy_diameter;
	var right_joy_top = touchpad_bottom - 0.075;

	mgraphics.ellipse(right_joy_left, right_joy_top, joy_diameter, joy_diameter);
	mgraphics.stroke();

	joy_helper("right", joy_diameter/3, right_joy_left+joy_diameter/2, right_joy_top-joy_diameter/2, joy_diameter/2);

	// abxy
	var button_diameter = 0.14;
	var touchpad_offset_x = 0.1;
	var touchpad_offset_y = 0.15;
	
	var x_button_left = touchpad_right + touchpad_offset_x;
	var x_button_top = touchpad_bottom + touchpad_offset_y;
	mgraphics.ellipse(x_button_left, x_button_top, button_diameter, button_diameter);
	button_stroke("button_x");
	
	var y_button_left = x_button_left + button_diameter;
	var y_button_top = x_button_top + button_diameter;
	mgraphics.ellipse(y_button_left, y_button_top, button_diameter, button_diameter);
	button_stroke("button_y");
	
	var b_button_left = y_button_left + button_diameter;
	var b_button_top = x_button_top;
	mgraphics.ellipse(b_button_left, b_button_top, button_diameter, button_diameter);
	button_stroke("button_b");
	
	var a_button_left = y_button_left;
	var a_button_top = x_button_top - button_diameter;
	mgraphics.ellipse(a_button_left, a_button_top, button_diameter, button_diameter);
	button_stroke("button_a");
	

	// dpad
	var dpad_long_edge = 0.14;
	var dpad_short_edge = 0.11;
	var dpad_edge_delta = dpad_long_edge - dpad_short_edge;
	rounded = 0.04;
	
	var r_dpad_right = touchpad_left - touchpad_offset_x;
	var r_dpad_left = r_dpad_right - dpad_long_edge - dpad_edge_delta/2;
	var r_dpad_top = x_button_top - dpad_edge_delta/2;
	var r_dpad_bottom = r_dpad_top - dpad_short_edge;
	var r_dpad_width = dpad_long_edge;
	var r_dpad_height = dpad_short_edge;
	mgraphics.rectangle_rounded(r_dpad_left, r_dpad_top, r_dpad_width, r_dpad_height, rounded, rounded);
	button_stroke("button_dpad_right");
	
	var up_dpad_right = r_dpad_left - dpad_edge_delta/2;
	var up_dpad_left = up_dpad_right - dpad_short_edge;
	var up_dpad_top = x_button_top + dpad_long_edge;
	var up_dpad_bottom = x_button_top - dpad_edge_delta/2;
	var up_dpad_width = dpad_short_edge;
	var up_dpad_height = dpad_long_edge;
	mgraphics.rectangle_rounded(up_dpad_left, up_dpad_top, up_dpad_width, up_dpad_height, rounded, rounded);
	button_stroke("button_dpad_up");
	
	var l_dpad_right = up_dpad_left - dpad_edge_delta/2;
	var l_dpad_left = l_dpad_right - dpad_long_edge;
	var l_dpad_top = r_dpad_top;
	var l_dpad_bottom = r_dpad_bottom;
	var l_dpad_width = dpad_long_edge;
	var l_dpad_height = dpad_short_edge;
	mgraphics.rectangle_rounded(l_dpad_left, l_dpad_top, l_dpad_width, l_dpad_height, rounded, rounded);
	button_stroke("button_dpad_left");
	
	var down_dpad_right = up_dpad_right;
	var down_dpad_left = up_dpad_left;
	var down_dpad_top = r_dpad_bottom - dpad_edge_delta/2;
	var down_dpad_bottom = down_dpad_top - dpad_long_edge;
	var down_dpad_width = dpad_short_edge;
	var down_dpad_height = dpad_long_edge;
	mgraphics.rectangle_rounded(down_dpad_left, down_dpad_top, down_dpad_width, down_dpad_height, rounded, rounded);
	button_stroke("button_dpad_down");
	
	var dpad_circle_left = l_dpad_left - dpad_edge_delta;
	var dpad_circle_top = up_dpad_top + dpad_edge_delta;
	var dpad_circle_diameter = 2 * dpad_long_edge + dpad_short_edge + dpad_edge_delta * 3;

	mgraphics.ellipse(dpad_circle_left, dpad_circle_top, dpad_circle_diameter, dpad_circle_diameter);
	mgraphics.stroke();

	// shoulder/triggers
	var shoulder_width = button_diameter * 3;
	var shoulder_height = 0.1;
	var shoulder_space = 0.05;

	var l_shoulder_right = r_dpad_right;
	var l_shoulder_left = l_shoulder_right - shoulder_width;
	var l_shoulder_bottom = l_top_outer[1] + shoulder_space ;
	var l_shoulder_top = l_shoulder_bottom + shoulder_height;
	mgraphics.rectangle_rounded(l_shoulder_left, l_shoulder_top, shoulder_width, shoulder_height, rounded, rounded);
	button_stroke("button_left_shoulder");

	var l_trigger_right = l_shoulder_right;
	var l_trigger_left = l_shoulder_left;
	var l_trigger_bottom = l_shoulder_top + shoulder_space ;
	var l_trigger_top = l_trigger_bottom + shoulder_height;
	mgraphics.rectangle_rounded(l_trigger_left, l_trigger_top, shoulder_width, shoulder_height, rounded, rounded);
	button_stroke("axis_left_trigger"); 
	trigger_text("left", l_trigger_left + 0.05, l_trigger_top + 0.02, "LT") ;

	var r_shoulder_right = x_button_left + shoulder_width;
	var r_shoulder_left = r_shoulder_right - shoulder_width;
	var r_shoulder_bottom = r_top_outer[1] + shoulder_space ;
	var r_shoulder_top = r_shoulder_bottom + shoulder_height;
	mgraphics.rectangle_rounded(r_shoulder_left, r_shoulder_top, shoulder_width, shoulder_height, rounded, rounded);
	button_stroke("button_right_shoulder");

	var r_trigger_right = r_shoulder_right;
	var r_trigger_left = r_shoulder_left;
	var r_trigger_bottom = r_shoulder_top + shoulder_space ;
	var r_trigger_top = r_trigger_bottom + shoulder_height;
	mgraphics.rectangle_rounded(r_trigger_left, r_trigger_top, shoulder_width, shoulder_height, rounded, rounded);
	button_stroke("axis_right_trigger"); 
	trigger_text("right", r_trigger_left + 0.05, r_trigger_top + 0.02, "RT") ;

	// guide, back, start, misc
	var guide_diameter = 0.14;
	var guide_left = -(guide_diameter/2);
	var guide_top = touchpad_bottom - 0.15;

	mgraphics.ellipse(guide_left, guide_top, guide_diameter, guide_diameter);
	button_stroke("button_guide");

	var misc_long_edge = 0.1;
	var misc_short_edge = 0.05;
	
	var back_left = touchpad_left - (misc_short_edge*2); // -(guide_diameter/2 + (misc_short_edge*2));
	var back_top = touchpad_top; // guide_top - guide_diameter*1.5;
	mgraphics.rectangle_rounded(back_left, back_top, misc_short_edge, misc_long_edge, misc_short_edge, 0.05);
	button_stroke("button_back");
	
	var start_left = touchpad_right + misc_short_edge; // (guide_diameter/2) + misc_short_edge;
	var start_top = touchpad_top; // guide_top - guide_diameter*1.5;
	mgraphics.rectangle_rounded(start_left, start_top, misc_short_edge, misc_long_edge, misc_short_edge, 0.05);
	button_stroke("button_start");
	
	var misc_left = -(misc_long_edge/2);
	var misc_top = guide_top - guide_diameter*(1.5);
	mgraphics.rectangle_rounded(misc_left, misc_top, misc_long_edge, misc_short_edge, 0.05, misc_short_edge);
	button_stroke("button_misc1");

	joy_text("left", left_joy_left + 0.05, l_bottom_outer[1] - 0.125);
	joy_text("right", right_joy_left, l_bottom_outer[1] - 0.125);

	touch_text("finger0", touchpad_left - 0.05, l_top_outer[1] + 0.2, "0");
	touch_text("finger1", touchpad_left + touchpad_width/2 + 0.1, l_top_outer[1] + 0.2, "1");

}
