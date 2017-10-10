var event_list = require("./event_list");

// 事件数据中心
// 每个图形调用一次自己的事件绑定方法，都在这里存储一个相关数据内容
// 当canvas触发某个事件的时候，判断是否点击在其图形区域内
// 如果是，则表示这个图形触发了事件
var G_EVENT_DATA = initEventData();

// 初始化事件数据库
function initEventData(){
	var obj = {};

	event_list.forEach(function(item, index, arr){
		obj[item] = {};
	});

	return obj;
}

exports.event_data = G_EVENT_DATA;