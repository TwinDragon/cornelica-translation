//=========================================================
// Function
//=========================================================

/*:ja
 * @plugindesc
 * 関数群
 */

var TS_Function = {};

// パーティのインデックスを取得
Game_Party.prototype.GetMembersIndex = function(name) {
	var index = -1;
	var list = $gameParty.battleMembersAll();
	for (var i = 0; i < list.length; i++) {
		if(name == list[i].name()){
			index = i;
			break;
		}
	}
	return index;
};


// シナリオの拡張子取得
TS_Function.getScenarioExtension = function(){
	
	var output = '.txt';
	
	// エンコードを行うか判定
	//if(!$gameTemp.isPlaytest() || argTsDecodeDebug){
	//	output = '.sl';
	//}
	
	return output;
};


TS_Function.convertEscape = function(text, evalFlg) {
	if (text === null || text === undefined) {
		text = evalFlg ? '0' : '';
	}
	var windowLayer = SceneManager._scene._windowLayer;
	if (windowLayer) {
		var result = windowLayer.children[0].convertEscapeCharacters(text);
		return evalFlg ? eval(result) : result;
	} else {
		return text;
	}
};

// 文字列内のif文判定
TS_Function.evalText = function(text) {
	// 条件式判定
	var regIf = /\s*if\(([^\)]+)\)/;
	var result = true;
	if (regIf.test(text)) {
		text = text.replace(regIf, '');
		var reg = RegExp.$1;
		if(reg){
			try {
				var s = $gameSwitches._data;
				var v = $gameVariables._data;
				result = !!eval(reg);
			} catch (e) {
				alert("条件エラー \n\n " + formula);
				result = true;
			}
		}
	}
	
	return [text,result];
	
};

// 名前からアクター取得
TS_Function.getActor = function(name){
	var output;
	$gameParty.members().forEach( function(data){
		if( data._name == name ){
			output = data;
			return ;
		}
	} );
	
	return output;
};

// 最小と最大の間の乱数を取得
TS_Function.rand = function(min,max){
	return Math.randomInt( (max-min+1) ) + min;
};

// 配列をシャッフル
TS_Function.shuffleArray = function(array){
	for(var i = array.length - 1; i > 0; i--){
		var r = Math.floor(Math.random() * (i + 1));
		var tmp = array[i];
		array[i] = array[r];
		array[r] = tmp;
	}
	return array;
};
// 配列からランダムで取得
TS_Function.getRandomArray = function(array){
	var output = null;
	array = this.shuffleArray(array);
	output = array[0];
	return output;
};

// 2点の距離取得
TS_Function.calcDistanceTwoPoint = function(x1,y1,x2,y2) {
	return Math.sqrt(Math.pow(x1 - x2,2) + Math.pow(y1 - y2,2));;
};

// リストからどこの値にいるかチェック
TS_Function.lineCheckArray = function(array,val){
	var output = null;
	for(var i=0, length=array.length; i<length; i++){
		var line = array[i];
		if( val <= line ){
			output = i;
			break;
		}
	}
	return output;
};



// 所持金確認
TS_Function.moneyCheck = function(money){
	return $gameParty.gold() >= money;
};


// 数字画像を表示
TS_Function.viewNumber = function(contents,num,x,y,num_bitmap,id,split,dot_bitmap,align){
	
	// デフォルト1
	id = id || 1;
	// デフォルト右詰め
	align = align || -1
	
	// ドット画像表示
	var dot_cnt = null;
	if(dot_bitmap){
		var dot_w = dot_bitmap.width;
		var dot_h = dot_bitmap.height / split;
		var dot_sy = dot_h * (id-1);
		
	}
	
	var num_x = x;
	var num_y = y;
	var num_val = num.toString();
	var num_w = num_bitmap.width / 10;
	var num_h = num_bitmap.height / split;
	var num_sy = num_h * (id-1);
	
	num_x -= (num_w * align);
	for (var i = num_val.length; i > 0; i--) {
		var id = i-1;
		var n = Number(num_val[id]);
		
		if(dot_bitmap){
			if(dot_cnt > 0 && dot_cnt % 3 == 0){
				num_x += dot_w * align;
				contents.blt(dot_bitmap, 0, dot_sy, dot_w, dot_h, num_x, num_y);
			}
			dot_cnt++;
		}
		num_x += num_w * align;
		contents.blt(num_bitmap, num_w * n, num_sy, num_w, num_h, num_x, num_y);
		
	}
};


// 変数簡易取得
TS_Function.getVal = function(id) {
	return $gameVariables.value(id);
};

TS_Function.setVal = function(id,val) {
	return $gameVariables.setValue(id,val);
};

// スイッチ簡易取得
TS_Function.getSwi = function(id) {
	return $gameSwitches.value(id);
};

TS_Function.setSwi = function(id,val) {
	return $gameSwitches.setValue(id,val);
};

// ピクチャの番号入れ替え
TS_Function.pictureSwap = function(id1,id2) {
	var tmp = $gameScreen._pictures[id1];
	$gameScreen._pictures[id1] = $gameScreen._pictures[id2];
	$gameScreen._pictures[id2] = tmp;
};

// 不具合を発生させない
var _TS_Function_Bitmap_blt = Bitmap.prototype.blt;
Bitmap.prototype.blt = function(source, sx, sy, sw, sh, dx, dy, dw, dh) {
	try {
		_TS_Function_Bitmap_blt.call(this, source, sx, sy, sw, sh, dx, dy, dw, dh);
	} catch (e) {
		console.log(e);
	}
};




//=============================================================================
// Game_Picture
//  機能追加
//=============================================================================

// ○画像動作後に関数呼び出し
var _TS_Function_Game_Picture_updateMove = Game_Picture.prototype.updateMove;
Game_Picture.prototype.updateMove = function() {
	var move = this._duration > 0 ? true : false;
	_TS_Function_Game_Picture_updateMove.call(this);
	if( this.mAfterFunk != undefined && move && this._duration == 0 ){
		// このタイミングで処理が終わった
		this.mAfterFunk = this.mAfterFunk(this);
	}
};

// 画像変更
Game_Picture.prototype.setName = function(name){
	this._name = name;
};

// 画像のスケールをセット
Game_Picture.prototype.setScaleX = function(scale){
	this._scaleX = scale;
};

// 画像の透過度セット
Game_Picture.prototype.setOpacity = function(opacity,time){
	
	time = time === undefined ? 0 : time;
	if(time == 0){
		this._targetOpacity = this._opacity = opacity;
	}else{
		this._targetOpacity = opacity;
		this._duration = time;
	}
};

// 画像の透過度セット
Game_Picture.prototype.setScale = function(scale,time){
	
	time = time === undefined ? 0 : time;
	if(time == 0){
		this._targetScaleX = this._scaleX = scale;
		this._targetScaleY = this._scaleY = scale;
	}else{
		this._targetScaleX = scale;
		this._targetScaleY = scale;
		this._duration = time;
	}
};

// 画像の座標セット
Game_Picture.prototype.setPosX = function(x,time){
	
	time = time === undefined ? 0 : time;
	if(time == 0){
		this._targetX = this._x = x;
	}else{
		this._targetX = x;
		this._duration = time;
	}
};

// 画像の座標セット
Game_Picture.prototype.setPos = function(x,y,time){
	
	time = time === undefined ? 0 : time;
	if(time == 0){
		this._targetX = this._x = x;
		this._targetY = this._y = y;
	}else{
		this._targetX = x;
		this._targetY = y;
		this._duration = time;
	}
};

Game_Picture.prototype.addPos = function(x,y,time){
	
	time = time === undefined ? 0 : time;
	x += this._x;
	y += this._y;
	if(time == 0){
		this._targetX = this._x = x;
		this._targetY = this._y = y;
	}else{
		this._targetX = x;
		this._targetY = y;
		this._duration = time;
	}
};

// 画像の透過度セット
Game_Picture.prototype.setReload = function(flag){
	this._bitmapReload = flag;
};

// ピクチャーのデータから一致したものを削除
Game_Screen.prototype.erasePictureEx = function(pict) {
	var pictureId = this._pictures.indexOf(pict);
	if(pictureId > 0){
		this._pictures[pictureId] = null;
	}
};


//=============================================================================
// Game_Picture
//  機能追加
//=============================================================================
var _TS_Function_Sprite_Picture_initialize = Sprite_Picture.prototype.initialize;
Sprite_Picture.prototype.initialize = function(pictureId) {
	_TS_Function_Sprite_Picture_initialize.apply(this,arguments);
	this._bitmapReloadCnt = 0;
};

var _TS_Function_Sprite_Picture_updateBitmap = Sprite_Picture.prototype.updateBitmap;
Sprite_Picture.prototype.updateBitmap = function() {
	_TS_Function_Sprite_Picture_updateBitmap.apply(this,arguments);
	var picture = this.picture();
	if (picture && $gameSwitches.value(67)) {
		if(picture._bitmapReload){
			picture._bitmapReload = false;
			
			var pictureName = picture.name();
			
			this._pictureName = "";
			this.loadBitmap();
			
			this._pictureName = pictureName;
			this.loadBitmap();
			
		}else{
			// 正常に読み込めない事があるので、定期的に読み込む
			this._bitmapReloadCnt++;
			if(this._bitmapReloadCnt >= 120 && $gameSwitches.value(67) == false){
				this._bitmapReloadCnt = 0;
				picture._bitmapReload = true;
			}
		}
	}
};

//=============================================================================
// Game_Event
// 追加変数
//=============================================================================

Game_Event.prototype.setOptionVariable = function(key,value) {
	this._optionVariable = this._optionVariable || {};
	this._optionVariable[key] = value;
};

Game_Event.prototype.getOptionVariable = function(key) {
	return this._optionVariable[key];
};

Game_Event.prototype.optionVariableClear = function(key) {
	return this._optionVariable = {};
};

//=============================================================================
// Game_Interpreter
// 機能変更
//=============================================================================

// Plugin Command
Game_Interpreter.prototype.command356 = function() {
	$saveEx.save('pluginSkip',true);
	var args = this._params[0].split(" ");
	var command = args.shift();
	this.pluginCommand(command, args);
	if(!$saveEx.load('pluginSkip')) this._index++;
	return $saveEx.load('pluginSkip');
};


