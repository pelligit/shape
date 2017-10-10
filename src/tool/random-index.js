// 获取随机的整数
function randomIndex(min, max){
	return (Math.random() * (max - min) + min) | 0;
}

exports.rdmindex = randomIndex;