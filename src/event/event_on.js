var event_list = require("./event_list");

exports.addEvent = function(canvas){
	
	event_list.forEach(function(item, index, arr){

		// 在canvas上绑定事件，
		
		// 当事件发生的时候，判断事件发生的区域是否在这个图形的区域内
		
		// 如果是，则表示这个图形发生了事件
		
		canvas["on" + item] = function(e){

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
};


// on: function(type, fn){
// 	// 向该形状添加事件
// 	var that = this;

// 	// 如果已经添加进事件队列了，则将回调函数推进去
// 	if(that.index in G_EVENT_DATA[type]){
// 		if(fn && typeof fn === "function"){
// 			// fn.call(that, e);// 将这个方法推进回调函数栈
// 			G_EVENT_DATA[type][that.index]["callback"].push(fn);
// 		}
// 	}else{
// 		// 否则添加进去事件队列
// 		G_EVENT_DATA[type][that.index] = {
// 			area: {},// 形状占据的区域
// 			type: that.name,// 类型，比如"dot","line","dashline".....等等
// 			params: that.params,
// 			callback: [fn]
// 		};
// 	}

// 	return this;
// },
// off: function(type){
// 	// 移除事件
// 	// 这是一次移除所有的事件，
// 	// 是否需要移除某一次的事件，那么on方法就需要返回一个事件序列了

// 	// 从事件数据库中删除就好了
// 	if(this.index in G_EVENT_DATA[type]){
// 		delete G_EVENT_DATA[type][this.index];
// 	}

// 	return this;
// },
