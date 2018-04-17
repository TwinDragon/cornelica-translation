//=========================================================
// TS_Decode
//=========================================================

/*:ja
 * @plugindesc
 * シナリオファイルデコード

 * @param Decode
 * @desc デコードを使用するか？
 * @default false
 
 * @param Key
 * @desc 変換用の値
 * @default 255
*/

var parameters = PluginManager.parameters('TS_Decode');
var argTsDecodeDebug = eval(parameters['Decode'] || 'false');
var argTsDecodeKey   = parseInt(parameters['Key'] || '255');

// シナリオファイル再生開始
ADV_System.prototype.fileLoad = function(filename) {
	var fs = require('fs');
	var filepath = this.localFileDirectoryPath()+filename+TS_Function.getScenarioExtension();
	var file_data = fs.readFileSync(filepath, 'utf-8');
	
	// エンコードを行うか判定
	//if(!$gameTemp.isPlaytest() || argTsDecodeDebug){
	//	var text_ary = file_data.split('');
	//	for (var i = 0; i < text_ary.length; i++) {
	//		//text_ary[i] = text_ary[i] ^ argTsDecodeKey;
	//		text_ary[i] = String.fromCharCode(text_ary[i].charCodeAt(0) ^ argTsDecodeKey);
	//	}
	//	
	//	file_data = text_ary.join('');
	//}
	
	return file_data;
}

