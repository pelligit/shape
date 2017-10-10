var alphabet = require("./alphabet");
var rdmIndex = require("./random-index");

// 英文字母表
var g_letter_list = alphabet();

// 获取随机的字母
function randomLetter(){
	var letters = g_letter_list;
	var sum = letters.length;
	var sixLetter = [];
	for(var i = 0; i < 10; i++){
		sixLetter.push(letters[rdmIndex(0, sum)]);
	}

	return sixLetter.join('');
}


exports.rdmletter = randomLetter;