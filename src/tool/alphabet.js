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

exports.alphabet = alphabet;