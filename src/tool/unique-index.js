var rdmLetter = require("./random-letter");

// 生成一个独一无二的序号，当前时间戳加上六位随机数
function makeAnIndex(){
	var cur = (new Date()).getTime() + "";
	var letter = rdmLetter();
	return letter + "_" + cur;
}

exports.uniqueIndex = makeAnIndex;