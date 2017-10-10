var cEle = require("../dom/c-ele");
var uniqueIndex = require("../tool/unique-index");

// 创建一个离屏canvas
exports.offset_c = function(w, h){
	var _this = this;
	// 创建canvas元素
	var c = cEle("canvas");

	w = w ? w/1 : 300;
	h = h ? h/1 : 150;

	if(!isNaN(w)){
		c.width = w;
	}else{
		c.width = 300;
	}

	if(!isNaN(h)){
		// 如果是数字
		c.height = h;
	}else{
		c.height = 150;
	}

	var ctx = c.getContext("2d");

	var realIndex = "offset_" + uniqueIndex();

	// 离屏canvas对象
	G_OFFSET_CANVAS[realIndex] = {
		box: c,
		ctx: ctx,
		index: realIndex,
		width: w,
		height: h
	};

	// 内部的Shape对象，和离屏canvas的键一样
	G_INNER_SHAPE_OBJECT[realIndex] = new Shape(c);

	this.index = realIndex;

	// 获取canvas相关信息
	this.canvas = c;
	this.ctx = ctx;

	// 内部的Shape对象
	this.shapeObject = function(i){
		return G_INNER_SHAPE_OBJECT[i];
	};

	// 删除这个离屏canvas
	this.drop = function(i){
		delete G_OFFSET_CANVAS[i];
		delete G_INNER_SHAPE_OBJECT[i];

		// 手动删除这个对象
		_this = null;
		
		return true;
	};
}