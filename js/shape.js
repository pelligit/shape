/**
 * 2017-9-28 初步完成形状添加事件，对于圆形，矩形，可以测试点击事件了
 */

// 粒子系统
// 事件管理
// 碰撞检测
// 时间系统
// 资源管理
// 图形
// 图形扩展
// 运动系统
// 调试
// 
// 
// 
// 
// 双曲线
// 波浪线
// 直线
// 扇形
// 

(function(win){
	// 全局变量
	var g_event_all = [
		"click",
		"dblclick",
		"dragNew",
		"dragendNew",
		"dragenterNew",
		"dragleaveNew",
		"dragoverNew",
		"dragstartNew",
		"dropNew",
		"mousedown",
		"mousemove",
		"mouseout",// 需要单独实现
		"mouseover",// 需要单独实现
		"mouseup",
		"mousewheelNew",
		"scroll"
	];

	// 英文字母表
	var g_letter_list = alphabet();

	var cEle = function(str){
		return document.createElement(str);
	};

	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// 数据管理部分
	
	// 形状数据库，保存所有的图形
	var G_SHAPE_DATA = {};
	
	// 保存所有图形的编码（在图形库里的名字）
	var G_SHAPE_INDEX_DATA = [];// 以便获知第几次画了哪个形状
	
	// 解决的问题
	// 第五次画了哪个形状？
	// 某个形状是第几次画的？
	// --------------------------------------------

	// 动作存储器
	// 每一个绘制都是一个动作
	// 每一次擦除都是一个动作
	var G_ACTION_DATA = {};
	
	// 事件数据中心
	// 每个图形调用一次自己的事件绑定方法，都在这里存储一个相关数据内容
	// 当canvas触发某个事件的时候，判断是否点击在其图形区域内
	// 如果是，则表示这个图形触发了事件
	var G_EVENT_DATA = initEventData();

	var DataAll = {
		shapes: G_SHAPE_DATA,
		shape_index: G_SHAPE_INDEX_DATA,
		action: G_ACTION_DATA,
		event: G_EVENT_DATA,
	};

	var G_OFFSET_CANVAS = {};

	var G_INNER_SHAPE_OBJECT = {};// 内部的shape对象，用在离屏canvas，或者隐藏的canvas上

	var G_PATH_DATA = {};

	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------

	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// ---------------------------------------------------------
	// 画一个点
	function drawDot(x, y, r, fill){
		this.beginPath();
		this.arc(x, y, r, 0, Math.PI*2, true);
		
		if(fill){
			this.fill();
		}else{
			this.stroke();
		}

		this.closePath();
	}

	// 画线
	function drawLine(){
		var args = Array.prototype.slice.call(arguments);
		var len = args.length;

		// 不是偶数个参数
		if(len%2 !== 0){
			args.push(0);
		}

		this.beginPath();
		for(var i = 0; i < len; i = i + 2){
			this.moveTo(args[i], args[i + 1]);
			this.lineTo(args[i + 2], args[i + 3]);
		}

		this.stroke();
		this.closePath();
	}

	// 将线段的两个终点进行处理
	// 使在画线段的时候，图形一直在特定矩形区域内
	// 比如重新画到另外一个canvas上时候
	// 也会刚刚处于这个矩形区域内，
	function putLineInCenter(x1, y1, x2, y2){
		// 将其中一个点移动到（0, 0）
		var x11 = x1 - x1;// 0
		var y11 = y1 - y1;// 0
		var x21 = x2 - x1;
		var y21 = y2 - y1;

		if(y21 < 0){
			y11 = -y21;
			y21 = 0;
		}

		if(x21 < 0){
			x11 = -x21;
			x21 = 0;
		}
		
		// 设置相对位置
		return [x11, y11, x21, y21];
	}

	// 画一条虚线
	function drawDashline(x1, y1, x2, y2, r, distance){
		var dotR = r || 1;
		var ctx = this;

		var point = dashPoints(x1, y1, x2, y2, r, distance);

		// 开始画图
		var len = point.length;
		for(var j = 0; j < len; j++){
			drawDot.call(ctx, point[j]["x"], point[j]["y"], dotR, true);
		}
	}

	// 获取虚线之间所有的点
	function dashPoints(x1, y1, x2, y2, r, dis){
		
		var distance = dis || 5;

		// 获取两个点的距离
		var pointDis = twoPointDistance(x1, y1, x2, y2);
		var sum = (pointDis/distance)|0;// 看一共有多少个点

		var xDis = (x2 - x1)/sum;// x方向的距离
		var yDis = (y2 - y1)/sum;// y方向的距离

		var point = [{x: x1, y: y1}];

		for(var i = 0; i < sum; i++){
			point.push({
				x: x1 + xDis * i,
				y: y1 + yDis * i
			});
		}

		return point;
	}

	// 要么描边，要么填充，如果既要描边又要填充呢？
	function drawRect(x, y, width, height, fill){
		var ctx = this;

		ctx.beginPath();
		
		if(fill){
			ctx.fillRect(x, y, width, height);
		}else{
			ctx.strokeRect(x, y, width, height);
		}

		ctx.closePath();
	}

	// ----------------------------------------------------------
	// ----------------------------------------------------------
	// ----------------------------------------------------------
	// ----------------------------------------------------------
	// ----------------------------------------------------------
	// ----------------------------------------------------------
	// 构造函数
	function Shape(canvas){
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

		// 内部事件
		var _this = this;

		g_event_all.forEach(function(item, index, arr){
			
			// 在canvas上绑定事件，
			// 当事件发生的时候，判断事件发生的区域是否在这个图形的区域内
			// 如果是，则表示这个图形发生了事件
			
			_this.box["on" + item] = function(e){

				// 坐标转换
				// 相对于画布的坐标转换
				
				// 当前事件的所有形状对象
				var eTypeList = G_EVENT_DATA[item];
				
				var tempEventObj = null;
				
				for(var name in eTypeList){
					tempEventObj = eTypeList[name];

					// 判断点是否是在圆内:目前只有圆形和点可以通过这种方法判断
                    // eventActive = G_SHAPE_DATA[name].in(e.x, e.y);

					// 判断当前事件发生的位置是否是该图形区域，如果是的话，则调用这个图形的事件回调函数
					var eventActive = eventIsActive(tempEventObj, e, item);

					if(eventActive){
						
						// 按顺序调用回调函数栈里面的事件方法
						var callbacks = tempEventObj.callback;
						
						callbacks.forEach(function(fnItem, index, arr){
							fnItem.call(tempEventObj, e);
						});
					}
				}
			};
		});
	}

	Shape.prototype.dot = function(x, y, r){
		var _this = this;

		var ctx = _this.ctx;

		drawDot.call(ctx, x, y, r, true);

		var data = {
			name: "dot",
			shape: {
				box: _this.box,
				ctx: ctx
			},
			layer: 23,
			props: getCtxProps(ctx),// 当前绘图句柄的属性值
			params: [x, y, r],
			absolute: [r, r, r],
			cur: {// 当前的位置状态,动画变化用到的属性
				x: x,
				y: y,
				r: r
			},
			in: function(x, y){
				// 判断点是否位于该图形区域内,可以判断事件是否发生
				// 不同形状有不同的判断方式，这里是圆的判断方式
                var dis = twoPointDistance(this.params.x, this.params.y, x, y);

                if(dis <= this.params.r){
                    return true;
                }else{
                    return false;
                }
			},
			area: {
				rect: {
					// 所占的矩形区域
					x: 34,
					y: 44,
					width: 399,
					height: 45,
				},
				real: {
					// 实际的区域
				},
			}
		};

		return G_SHAPE_DATA[setShapeProps(data)];
	};

	Shape.prototype.line = function(x1, y1, x2, y2){
		var _this = this;
		var ctx = _this.ctx;

		drawLine.call(ctx, x1, y1, x2, y2);
		
		var relativeArr = putLineInCenter(x1, y1, x2, y2);

		var data = {
			name: "line",
			shape: {
				box: _this.box,
				ctx: ctx
			},
			layer: 45,
			props: getCtxProps(ctx),
			params: [x1, y1, x2, y2],
			absolute: relativeArr,
			cur: {// 当前的位置状态,动画变化用到的属性
				x1: x1,// 当前圆心的位置
				y1: y1,
				x2: x2,
				y2: y2,
			},
			in: function(x, y){
				// 判断是否在线上
				// 垂线
			},
			area: {
				rect: {
					// 所占的矩形区域
					x: 0,
					y: 0,
					width: Math.abs(x1 - x2),
					height: Math.abs(y1 - y2),
				},
				real: {
					// 实际的区域
				},
			}
		};

		return G_SHAPE_DATA[setShapeProps(data)];
	};

	Shape.prototype.dashline = function(x1, y1, x2, y2, r, dis){
		var _this = this;
		var ctx = _this.ctx;

		drawDashline.call(ctx, x1, y1, x2, y2, r, dis);
		
		// 设置相对位置
		var relativeArr = putLineInCenter(x1, y1, x2, y2);

		// 对于虚线，应该存储所有的点
		var data = {
			name: "dashline",
			shape: {
				box: _this.box,
				ctx: ctx
			},
			props: getCtxProps(ctx),
			params: [x1, y1, x2, y2, r, dis],
			layer: 45,
			absolute: relativeArr,
			cur: {// 当前的位置状态,动画变化用到的属性
				x1: x1,// 当前圆心的位置
				y1: y1,
				x2: x2,
				y2: y2,
				r: r,
				dis: dis
			},
			in: function(x, y){
				// 在不在虚线上
				// 在虚线的每个点上
				// 遍历虚线的每个点，判断距离每个点圆心的距离是否小于半径
				var points = dashPoints(x1, y1, x2, y2, r, dis);
				var tempDis;

				for(var i = 0, len = points.length; i < len; i++){
					tempDis = twoPointDistance(x, y, points["x"], points["y"]);
					if(tempDis <= r){
						return true;
					}
				}

				return false;
			},
			area: {
				rect: {
					// 所占的矩形区域，在canvas中单独画这个形状所需要的矩形面积
					x: 0,
					y: 0,
					width: Math.abs(x1 - x2) + 2 * r,
					height: Math.abs(y1 - y2) + 2 * r,
				},
				real: {
					// 实际的区域
				},
			}
		};

		return G_SHAPE_DATA[setShapeProps(data)];
	};

	Shape.prototype.rect = function(x, y, width, height, fill){
		var _this = this;
		var ctx = _this.ctx;

		drawRect.call(ctx, x, y, width, height, fill);

		var data = {
			name: "rect",
			shape: {
				box: _this.box,
				ctx: ctx
			},
			layer: 45,
			props: getCtxProps(ctx),
			params: [x, y, width, height],
			absolute: [0, 0, width, height],
			cur: {// 当前的位置状态,动画变化用到的属性
				x: x,// 当前圆心的位置
				y: y,
				w: width,
				h: height
			},
			in: function(x1, y1){
				// 判断某个点是否在这个矩形内,因为是规则的形状，比较好处理
				if(x1 >= x && y1 >= y && x1 <= x + width && y1 <= y + height){
					return true;
				}else{
					return false;
				}
			},
			area: {
				rect: {
					// 所占的矩形区域
					x: x,
					y: y,
					width: width,
					height: height,
				},
				real: {
					// 实际的区域
				},
			}
		};

		return G_SHAPE_DATA[setShapeProps(data)];
	};

	Shape.prototype.circle = function(x, y, r, fill){
		var _this = this;
		var ctx = _this.ctx;

		drawDot.call(ctx, x, y, r, fill);

		var data = {
			name: "circle",
			shape: {
				box: _this.box,
				ctx: ctx
			},
			props: getCtxProps(ctx),
			params: [x, y, r, fill],
			absolute: [r, r, r, fill],
			layer: 45,
			cur: {// 当前的位置状态
				x: x,// 当前圆心的位置
				y: y,
				r: r
			},
			in: function(x1, y1){
				var tempDis = twoPointDistance(x1, y1, x, y);

				if(tempDis <= r){
					return true;
				}else{
					return false;
				}
			},
			area: {
				rect: {
					// 所占的矩形区域
					x: x - r,
					y: y - r,
					width: r * 2,
					height: r * 2,
				},
				real: {
					// 实际的区域
				},
			}
		};

		return G_SHAPE_DATA[setShapeProps(data)];
	};


	Shape.prototype.config = function(obj){
		// 配置项
	};

	// 事件,自定义事件,显式添加事件
	Shape.prototype.on = function(type, fn){
		var _this = this;

		_this.box["on" + type] = function(event){
			var that = this;// _this.box
			
			if(fn && typeof fn === 'function'){
				fn.call(that, event);
			}
		};
	};


	Shape.prototype.auto = function(){
		// 自动画图
	};

	Shape.prototype.draw = function(){
		// 画图
	};

	Shape.prototype.extend = function(){
		// 对这个类库进行扩展
	};

	Shape.prototype.next = function(){
		// 前进一步
	};

	Shape.prototype.pre = function(){
		// 回到上一次（撤销）
	};

	Shape.prototype.go = function(index){
		// 去往第index个动作
	};

	Shape.prototype.background = function(){
		// 画布的背景
	};

	// 两个画布相互变换图形


	// 内部属性,应定义为不可更改属性，目前这个还是可以更改的
	Shape.prototype.__inner__ = {
		data: DataAll
	};

	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	
	// 矩形
	// 线段
	// 圆形
	// 半圆
	// 三角形
	// 圆角矩形
	// 五角星
	// 
	function setShapeProps(data){
		if(!data){
			data = {};
		}

		// 获取一个随机的图形编号
		var spIndex = "shape_" + makeAnIndex();

		// 在图形编号库里面的索引
		var indexInShapeIndexArr = addShapeIndex(spIndex);

		data["index"] = spIndex;
		data["indexInArr"] = indexInShapeIndexArr;

		G_SHAPE_DATA[spIndex] = shapeInfos(data);

		return spIndex;
	}

	// 每个形状都有的属性和方法
	function shapeInfos(data){
		// 一个形状拥有的属性和方法
		var AShapeInfo = {
			name: data.name,		// 形状的名字【不可修改属性】
			index: data.index,		// 形状对应的对象名，图形库里的图形编码，改动后的属性
			_index: data.index,		// 形状对应的对象名，图形库里的图形编码,原始名字，不可修改属性
			shapeIndex: data.indexInArr,// 修改后的序号
			_shapeIndex: data.indexInArr,// 原始序号，不可修改属性，第几个形状
			box: data.shape.box,		// 该图形所在的canvas
			ctx: data.shape.ctx,			// 该形状所对应的绘图上下文
			layer: data.layer,			// 层次
			_layer: data.layer,			// 原始层次，不可修改属性
			area: data.area,

			current: data.cur,
			touch: {// 是否可在最上层被接触
				can: true,// 如果是false，则show为空数组，意味着被其他图形覆盖了
				show: [{x:2,y:55},{x:44,y:23}],//可以被直接点击的区域。有可能和别的图形有层叠关系，该图形在顶层可以被直接点击到的像素区域
				hide: [],// 该形状不可见的部分。这里应该是一条路径，根据路径包含的地方，可以确定范围
			},
			group: {
				isGroup: false,// 是否是一个组
				children: {},// 直接的子元素，子对象，文字，其他形状等，通过add，append方法添加进来的
				parent: "shapeOBj",// 直接的父元素 
			},
			props: data.props,// 绘制这个图形时候，绘图句柄的属性
			params: data.params,// 绘制这个图形时候传递的参数
			absolute: data.absolute,
			speed: 23,			// 运动的速度
			ax: 3,				// 横向加速度
			ay: 5,				// 纵向加速度
			config: function(obj){
				var _this = this;
				// 可以配置的属性：layer, speed, ax, ay,其他属性忽略
				for(var name in obj){
					if(name in _this && typeof obj[name] !== "function"){
						_this[name] = obj[name];
					}
				}

				return this;
			},
			on: function(type, fn){
				// 向该形状添加事件
				var that = this;

				// 如果已经添加进事件队列了，则将回调函数推进去
				if(that.index in G_EVENT_DATA[type]){
					if(fn && typeof fn === "function"){
						// fn.call(that, e);// 将这个方法推进回调函数栈
						G_EVENT_DATA[type][that.index]["callback"].push(fn);
					}
				}else{
					// 否则添加进去事件队列
					G_EVENT_DATA[type][that.index] = {
						area: {},// 形状占据的区域
						type: that.name,// 类型，比如"dot","line","dashline".....等等
						params: that.params,
						callback: [fn]
					};
				}

				return this;
			},
			off: function(type){
				// 移除事件
				// 这是一次移除所有的事件，
				// 是否需要移除某一次的事件，那么on方法就需要返回一个事件序列了

				// 从事件数据库中删除就好了
				if(this.index in G_EVENT_DATA[type]){
					delete G_EVENT_DATA[type][this.index];
				}

				return this;
			},
			animate: function(){
				// 对这个图形应用动画
				return this;
			},
			clear: function(){
				// 清除画布中这个形状覆盖的内容
				return this;
			},
			append: function(shapeObj){
				// 在这个元素上添加一个图形
			},
			remove: function(){
				// 移除这个形状
				return this;
			},
			in: data.in,
			image: function(type){// jpg, jpeg, png, gif
				// 生成一个只包含该形状的base64 image图像
				// var img1 = new Image();
				var _this = this;
				var shapeName = _this.name;

				// 当前图形的尺寸
				var offsetC = new OffsetC(_this.area.rect.width, _this.area.rect.height);

				var innerSp = offsetC.shapeObject(offsetC.index);

				innerSp[shapeName].apply(innerSp, _this.absolute);

				var imgBase64 = offsetC.canvas.toDataURL(type);

				offsetC.drop();// 删除这个对象，释放内存

				return imgBase64;
			},
			throw: function(x, y, clear){// 最终
				// 将这个形状扔出去
				return this;
			},
			drag: function(clear){
				// clear 参数作为橡皮擦
				// 拖动这个图形
				return this;
			},
			rotate: function(deg){
				// 旋转
				return this;
			},
			scale: function(ratio){
				// 缩放
				return this;
			},
			transelate: function(x, y){
				// 平移
				return this;
			},
			skew: function(){
				// 斜切
				return this;
			},
			shadow: function(x, y, blur, color){
				// 添加阴影
				return this;
			},
			copy: function(x, y){
				var _this = this;
				// 复制一份这个图形,置于点（x,y）处
				switch(_this.name){
					case "dot":
						var arr = [];
						var len = _this.params.length;
						for(var i = 0; i < len; i++){
							arr.push(_this.params[i]);
						}
						
						if(x){
							arr[0] = x;
						}

						if(y){
							arr[1] = y;
						}

						Shape.prototype.dot(arr[0], arr[1], arr[2]);
						break;
					case "circle":
						// 
						break;
				}

				return _this;
			},
			layer: function(layer){
				// 将层次修改为layer层，layer = 1, 2, 3, 4.....-1, -2, -3......
				return this;
			},
			fly: function(x, y){
				// 飞向.....（x,y）这个点
				return this;
			},
			draw: function(){
				// 重绘这个形状
				var ctx = this.ctx;

				var _this = this;

				// 这样虽然能重新画一下，但是，数据库里面的index却变了，而且还新增了一个形状
				// 正常来说，图形重画了，但是数据库里面没有多数据，叫这个名字的形状依然还是在
				// Shape.prototype[_this.name].apply(_this, _this.params);// 画完之后，
				// G_SHAPE_DATA[_this.name] = _this;// 将原来的这个

				return this;
			},
			play: function(){
				// 演示这个画点的过程
			},
			combine: function(shapeIndex){
				// 将两个图形组合为一个图形
			},
			boom: function(){
				// 将组合形状炸开
			},
			fill: function(style){
				// 重新填充样式
			},
			text: function(txt){
				// 在文字区域写字
			},
			add: function(shapeObj){// 参数是另外一个形状
				// 在图形上放置一个新形状
			},
            put: function(shapeObj){// 参数是另外一个形状
                // 把这个图形放置于另一个图形上
            },
			follow: function(path){
				// 跟随路径移动
			},
			knocked: function(obj){
				// 被撞击
				obj = {
					who: name,// 被谁撞了
					count: 34,// 被碰撞的次数
				};
			},
			reset: function(){
				// 将这个图形变为初始样子
				// 通常是在经过了变换之后使用该方法
				// 比如通过动画之后，位置改变了
				// 可以使用这个方法变为最开始时候的样子
			},
			mirror: function(x1, y1, x2, y2){
				// 镜像变换
				// 将该形状相对于这条线镜像变换
				// 如果只有两个参数，则表示相对于某个点镜像变换
			},

			help: function(){
				// 显示边框
				// 显示辅助线
			}
		};

		// 添加事件. a_dot.click(function(e){}).....这种调用方式
		g_event_all.forEach(function(item, index, arr){
			AShapeInfo[item] = function(fn){
				if(fn && typeof fn=== "function"){
					AShapeInfo.on(item, fn);
				}
			}
		});

		return AShapeInfo;
	}

	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// -------------------------------------------------------------
	// 两点之间的中点
	function middlePoint(x1, y1, x2, y2){
		var mx = (x1 + x2)/2;
		var my = (y1 + y2)/2;

		return {
			x: mx,
			y: my
		}
	}

	// 生成一个独一无二的序号，当前时间戳加上六位随机数
	function makeAnIndex(){
		var cur = (new Date()).getTime() + "";
		var letter = randomLetter();
		return letter + "_" + cur;
	}

	// 获取随机的整数
	function randomIndex(min, max){
		return (Math.random() * (max - min) + min) | 0;
	}

	// 获取随机的字母
	function randomLetter(){
		var letters = g_letter_list;
		var sum = letters.length;
		var sixLetter = [];
		for(var i = 0; i < 10; i++){
			sixLetter.push(letters[randomIndex(0, sum)]);
		}

		return sixLetter.join('');
	}

	// 两点之间的距离
	function twoPointDistance(x1, y1, x2, y2){
		return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
	}

	// 初始化事件数据库
	function initEventData(){
		var obj = {};

		g_event_all.forEach(function(item, index, arr){
			obj[item] = {};
		});

		return obj;
	}

	// 向图形序号数据库中添加一个形状
	function addShapeIndex(spIndex){
		G_SHAPE_INDEX_DATA.push(spIndex);

		// 返回这个形状库该图形的序号
		return G_SHAPE_INDEX_DATA.length - 1;
	}

	// 生成英文字母表
	function alphabet(upercase){
	    var getLetter = function(index){
	        return String.fromCharCode(index);
	    };

	    var upper = function(letter){
	        return letter.toUpperCase();
	    }

	    var letters = '';
	    for(var start = 97, end = start + 26; start < end; start++){
	        letters += upercase ? upper(getLetter(start)) : getLetter(start);
	    }

	    return letters;
	}

	// 判断形状是否发生了某个事件
	// // 判断事件是否发生:针对某个形状
	// obj - 某个形状，比如一个矩形或者一个圆形
	// e - 事件发生时候的事件属性
	// etype - 事件类型
	function eventIsActive(obj, e, etype){
		// 判断该形状是否触发了事件，主要判断事件发生的位置是否在图形区域内
		// 返回true或者false
		// 鼠标事件
		
		// 假设现在是一个圆，判断鼠标点击的位置是否是在圆里
		// 点击事件，判断点击的点是不是在形状内
		var activeX = e.x;
		var activeY = e.y;

		var center = {
			x: obj.params[0],
			y: obj.params[1],
			r: obj.params[2]
		};

		var dis = twoPointDistance(activeX, activeY, center.x, center.y);

		if(dis <= center.r){
			return true;
		}else{
			return false;
		}
	}

	// 获得当前绘图句柄的各项属性值
	function getCtxProps(ctx){
		var obj = {};

		for(var name in ctx){
			var curType = typeof ctx[name];
			if(curType !== "function" && curType !== "object"){
				obj[name] = ctx[name];
			}
		}

		return obj;
	}

	// 创建一个离屏canvas
	function OffsetC(w, h){
		var _this = this;
		// 创建canvas元素
		var c = cEle("canvas");

		w = w ? w/1 : 300;
		h = h ? h/1 : 150;

		if(!isNaN(w) && !isNaN(h)){
			// 如果是数字
			c.width = w;
			c.height = h;
		}

		var ctx = c.getContext("2d");

		var realIndex = "offset_" + makeAnIndex();

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

	// 路径相关内容。内部使用
	function Path(){
		var _this = this;

		// 路径类
		this.name = "path";
		this.store = [];// 子路径数据库
		this.index = "path_" + makeAnIndex();

		// 新增一个子路经
		this.add = function(path){
			
			_this.store.push(path);

			return this;
		};

		// 高亮这个路径，调用描边方法
		this.highlight = function(){
			var paths = _this.store();
			path.forEach(function(){
				// 遍历子路径，
			});
		};

		this.create = function(ctx){
			// 创建一个路径
		};

		this.fill = function(style){
			// 参数是填充方式
			// 填充子路经
		};

		this.stroke = function(style){
			// 参数是描边样式
			// 描边子路经
		};

		this.drop = function(){
			_this = null;
			return true;
		};
	}

	win = window;
	win.Shape = Shape;
})(window);