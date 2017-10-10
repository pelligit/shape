// 构造函数
exports.Shape = function(canvas){
	var w = canvas.width;
	var h = canvas.height;

	this.constructor = Shape;
	this.box = canvas;
	this.ctx = canvas.getContext("2d");
	this.boxWidth = w;
	this.boxHeight = h;

	this.range = {
		xMin: 0,
		xMax: w,
		yMin: 0,
		yMax: h
	};

	// 基本信息
	this.info = {
		author: "Pelli",
		email: "pelli_mail@163.com"
	};

	this.start = (new Date()).getTime();

	// 距离现在多久了
	this.sofar = function(){
		return (new Date()).getTime - this.start;
	};
};