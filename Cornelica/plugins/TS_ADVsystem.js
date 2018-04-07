/*:ja
 * @plugindesc
 * ADV用の演出の為のシステム
 */

//***************************************************************
// クラス定義
//***************************************************************
if( ADV_System == null ){
	function ADV_System() {
	  this.initialize.apply(this, arguments);
	}
}

// イニシャライズ
ADV_System.prototype.initialize = function() {
	
	// スクリプトのスタック
	this.mStack = [];
	
	// 最後に表示したメッセージ
	this.mLastMessage = null;
	
	// 実行中か？
	this.mRun = false;
	
	// プリロード用のカウント
	this.mPlCnt = 0;
	
	// 回想モード用の変数
	this.mReplayMode = null;
	
	// 立ち絵のトランジション判定
	this.mTrans = false;
	
	// 終了待ちのタイプ
	this.mWaitMode = '';
	// 判定時に使うデータ
	this.mWaitData = null;
	// 終了待ちが時間指定の場合
	this.mWaitCount = 0;
	// テキスト頭部分の調整を行う
	this.mTextSpace = true;
	// テキスト調整を行う
	this.mTextAjasuto = true;

	
	//=================================================
	// 企画毎に変更
	//=================================================
	// アクター名から立ち絵取得
	this.STAND_NAME = {
		"サクラ"   :"サクラ",
	};
	
	// 服装によっては表情に使用する画像が変わる
	this.CHANGE_FACE = {
		'iris':['yoroi','yoroimk','oiran'],
		'zexy':['normal'],
	}
	
	//=================================================
	// 画像関係
	//=================================================
	// 画像用のリスト
	this.mPictId = [];
	this.mViewPictId = -1;
	
	//立ち絵のl,c,rの数値
	this.BS_BASE_X = Graphics.boxWidth/2;
	this.BS_BASE_Y = Graphics.boxHeight/2;
	//this.BS_L = -210;
	//this.BS_R = 210;
	this.BS_L = Graphics.boxWidth/-4;
	this.BS_R = Graphics.boxWidth/4;
	this.BS_C = 0;
	this.BS_MOVE = 50;
	this.BS_TRANS_TIME = 250;

	// 各レイヤー毎にずらす番号
	this.ADD_LAYER_NUM = {
	  BASE   :10,// 下記のグループ毎に追加
	  OP2    :6,
	  DEFAULT:5,
	  OP     :4,
	  BODY   :2,
	};
	
	// 背景用のピクチャ番号
	this.BG_PICT_ID = 1;
	
	// EV用レイヤー
	this.EV_LAYER = 1;
	this.EV2_LAYER =7;
	
	// 立ち絵のデフォルト名
	this.DEFAULT_NAME = {
	  BODY :"服",
	  OP   :"NO",
	  OP2  :"NO",
	};
	
	// 立ち絵の表示枚数制限
	this.PICT_MAX = 7;
	this.PICT_NEW_LAYER = 8;
	
	//=================================================
	// メッセージ関係
	//=================================================
	
	// テキスト表示枠
	this.mWindowBack = 0;
	// テキスト表示場所
	this.mWindowPos = 2;
	// 選択肢のリスト
	this.mSelectList = [];
	
	
	//改行文字数
	//this.VIEW_TEXT_NUM = 27;
	this.VIEW_TEXT_NUM = 31;
	// ウィンドウサイズ分ずらす
	//this.SPACE_AJASUTO = "　　　　";
	this.SPACE_AJASUTO = "　　　";
	
	//最初のスペース数（名前部分なので台詞の括弧の分一文字少ない）
	this.F_SPACE = "　" + this.SPACE_AJASUTO;
	//改行後のスペース数
	this.SPACE = this.F_SPACE + "　";
	//スペース（一つ）地の文の一行目用に1つ追加
	this.SPACE_ONE = this.SPACE + "　";
	
	// 改行の文字コード
	//this.ENTER_CODE = '\u21B5';

	// 行頭禁則文字
	this.FOLLOWING = "%),:;]}｡｣ﾞﾟ。，、．：；゛゜ヽヾゝ" + 
	            "ゞ々’”）〕］｝〉》」』】°′″℃￠％‰　 ";
	// 制御文字
	//this.ESCAPE = /^[\$\.\|\^!><\{\}\[\]\\]|^[A-Z]|^\d/;
	
	// テキストの空白を入れるか判定用の制御文字
	//this.NO_SPACE = /\CL/i;

	

	// キャラの強調表現を行うかのフラグ
	//var CHARA_EMP = true;
	// 名前抜き出しの正規表現
	//var SEARCH = {
	//  NAME :/^　　([^　].*)\n　　/,
	//  COLOR:/\\c\[\d+\](.*)\\c\[\d+\]/,
	//};
	//var CHARA_OPACITY = 180;
	
	
};

// 制御文字
ADV_System.prototype.ESCAPE = function() {
	return /^[\$\.\|\^!><\{\}\[\]\\]|^[A-Z]|^[a-z]|^\d/;
}
ADV_System.prototype.NO_SPACE = function() {
	return /\CL/i;
}

// 進行中かの判定
ADV_System.prototype.isRun = function() {
	return this.mRun;
}

// ==================================================================
// ADVシステムで使用する補助関数

// スタックの削除
ADV_System.prototype.resetStack = function() {
	this.mStack = [];
}

// メッセージウィンドウの設定リセット
ADV_System.prototype.resetMesOption = function() {
	// 背景：ウィンドウ
	this.mWindowBack = 0;
	// 表示：下
	this.mWindowPos = 2;
}

// シナリオファイルのパス
ADV_System.prototype.localFileDirectoryPath = function() {
	// var path = window.location.pathname.replace(/(\/www|)\/[^\/]*$/, '/scenario/');
	// if (path.match(/^\/([A-Z]\:)/)) {
	// 	path = path.slice(1);
	// }
	
	//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	var date_str = process.argv[0].split('\\');
	if (date_str.length < 1) {
		date_str = process.argv[0].split('/');
	}
	date_str = process.argv[0].substring(0, process.argv[0].length - date_str[date_str.length - 1].length) + "scenario/";
	//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
	
	return decodeURIComponent(date_str);
}

// 改行削除
ADV_System.prototype.chomp = function(str) {
	return str.replace(/[\n\r]/g,"");
}

// ミリ秒をフレーム数に変換
ADV_System.prototype.secToFrame = function(sec) {
	return Math.floor(60*sec/1000);
}

// マクロ追加
ADV_System.prototype.macroAdd = function(macro) {
	this.mStack.unshift(macro);
}

// マクロ引数取得
ADV_System.prototype.makeArg = function(macro,init) {
	
	var output = {};
	var list = macro.split(' ');
	
	// 最初はマクロ名なので削除
	list.shift();
	
	for(var i=0, len=list.length; i<len; i++){
		// 「=」で分割
		var arg = list[i].split('=');
		var key = arg.shift();
		arg = arg.join('=');
		output[ key ] = arg;
	}
	
	// 初期値入力
	for(key in init){
		if( output[key] == null ){
			output[key] = init[key];
		}
	}
	
	return output;
}

// マクロ変換
ADV_System.prototype.macroChange = function(macro) {
	var c_macro = [];
	
	if( macro.indexOf('@fin') != -1 ){
		// 変換
		argument = this.makeArg(macro,{});
		c_macro.push( '@se' );
		c_macro.push( '@bgs' );
		c_macro.push( '@bgv' );
		c_macro.push( '@flash t=300 wt=1' );
		c_macro.push( '@flash t=300 wt=1' );
		c_macro.push( '@flash t=1000' );
		if( argument['bg'] ){
			var ev_macro = '@ev f='+argument['bg'];
			if( argument['v'] ) ev_macro += ' v=' + argument['v'];
			c_macro.push( ev_macro );
		}
		if( argument['se'] ) c_macro.push( '@se f='+argument['se'] );
	}else if( macro.indexOf('@bgf') != -1 ){
		// 変換
		argument = this.makeArg(macro,{t:1000});
		c_macro.push( '@flash t='+argument['t'] );
		if( argument['bg'] ){
			var ev_macro = '@ev f='+argument['bg'];
			if( argument['v'] ) ev_macro += ' v=' + argument['v'];
			c_macro.push( ev_macro );
		}
		
	}else if( macro.indexOf('@rps_ex') != -1 ){
		// 変換
		c_macro.push( '@fadeout' );
		c_macro.push( '@se' );
		c_macro.push( '@bgs' );
		c_macro.push( '@bgv' );
		c_macro.push( '@bgm' );
		c_macro.push( '@bs' );
		c_macro.push( '@ev' );
		c_macro.push( '@wait t=1000' );
		c_macro.push( '@fadein' );
	}else if( macro.indexOf('@rps') != -1 ){
		// 変換
		c_macro.push( '@se' );
		c_macro.push( '@bgs' );
		c_macro.push( '@bgv' );
		c_macro.push( '@bgm' );
		c_macro.push( '@bs' );
		c_macro.push( '@ev' );
		c_macro.push( '@wait t=1000' );
	}
	/*
	else if( macro.indexOf('@qk') != -1 ){
		// 変換
		c_macro.push( '@map_scroll dir=l dis=1 spd=6 wt=1' );
		c_macro.push( '@map_scroll dir=r dis=2 spd=6 wt=1' );
		c_macro.push( '@map_scroll dir=l dis=1 spd=6 wt=1' );
	}
	*/
	else{
		c_macro.push(macro);
	}
	
	return c_macro;
}

// ドット絵移動ルートを作成
ADV_System.prototype.makeRoute = function(id,param) {
	// 何もない場合は空配列
	if( param === undefined ) param = [];
	// 配列じゃない場合は配列にする
	else if( typeof param == 'string' ) param = [param];
	else if( typeof param == 'number' ) param = [param];
	
	var output = {
		code : id,
		parameters : param,
	};
	return output;
}
// マップのキャラデータ取得
ADV_System.prototype.getCharacter = function(id) {
	var output = null;
	var isActor = false;
	
	if( id.indexOf != undefined && id.indexOf("AC") == 0 )
	{
		isActor = true;
		id = id.slice(2);
	}
	
	if( id == 'p' ) id = -1;
	// 数値に戻す（型変換）
	id = Number(id);
	
	if( id < 0){
		// プレイヤー
		output = $gamePlayer;
	} else if(isActor) {
		output = $gamePlayer.followers().follower(id);
		if(output === undefined) console.log('No Event : '+id);
	} else if(id > 0) {
		// IDが「0」の時は「呼び出し元のイベント」だけど
		// このスクリプトでは「呼び出し元のイベント」の判定が出来ない
		output = $gameMap.event(id);
		if(output === undefined) console.log('No Event : '+id);
	}
	return output;
}

// ボイス名削除
ADV_System.prototype.nameVoiceCut = function(text) {
	var output = text;
	
	if( text.indexOf('/') != -1 && text.indexOf('[') != -1 && text.indexOf(']') != -1 ){
		var name = text.split(']');
		var new_name = name[0];
		new_name = new_name.split('/');
		output = text.replace( name[0], new_name[0] );
	}
	return output;
}

// ●立ち絵の状態を取得（指定は日本語時の名前　例：イリス）
ADV_System.prototype.getBody = function(name,en) {
	var output = '';
	
	//if(this.STAND_NAME[name] === undefined) return;
	
	var cos_name = this.getBodyCos(name,en);
	
	// 継承して変更する
	output = this.STAND_NAME[name] + '_' + cos_name;
	
	return output;
}

// ●服装を取得（指定は日本語時の名前　例：イリス）
ADV_System.prototype.getBodyCos = function(name,en,dot) {
	var output = '';
	
	var cos_name = this.DEFAULT_NAME.BODY;
	
	return output;
}

// ●服装をオプションによって変化させる
ADV_System.prototype.changeBodyCos = function(cos,op) {
	var output = {};
	
	var op_list = op.split(":");
	var add_list = {};
	
	for(var i=0, length=op_list.length; i<length; i++){
		var pattern = op_list[i];
		add_list[pattern] = true;
	}
	
	// ※※※※※※
	// ここの追加順は立ち絵のファイル名によって変わる
	
	// 破れ
	if( cos.indexOf('hadaka') == -1 && add_list['yabure'] ){
		cos += '_' + 'yabure';
	}
	
	// ズーム
	if( add_list['z'] ){
		cos += '_' + 'z';
		output.zoom = true;
	}
	
	
	
	output.cos = cos;
	
	return output;
}

// ●アニメーションをさせるか判定
ADV_System.prototype.isAnimation = function() {
	return true;
}

// 表示テキストを調整する
// ※半角と全角、両方一文字として扱うので注意
ADV_System.prototype.viewMesAdjust = function(text) {
	
	if(!this.getAjasuto()){
		return text;
	}
	
	var output = "";
	
	// 制御文字の判定
	if(text.match(this.NO_SPACE())){
		this.mTextSpace = false;
	}
	
	// 名前の部分は改行する
	// ルビが出来るようになれば調整
	var text_space = this.SPACE;
	var text_f_space = this.F_SPACE;
	var text_space_one = this.SPACE_ONE;
	if(!this.mTextSpace){
		text_space = '';
		text_space_one = '';
		text_f_space = '';
		this.mTextSpace = true;
	}
	
	if( text.indexOf('[') == 0 ){
		// 名前の先頭に追加
		text = text_f_space+text;
		
		// 改行直後は名前と同じ箇所
		text = text.replace(/\]/,']\n'+text_f_space);
		// 名前の文字数を計算
		var text_len = text.split(']\n')[0].length+1;
		var cnt = 0;
		var voice = true;
		if( text.indexOf(']\n') != -1 ){
			// 台詞
			
			// 名前の括弧を外す
			text = text.replace(']','');
			text = text.replace('[','');
			// 括弧の分ずらす
			text_len -= 2;
			
		}
	}else{
		// 地の文
		voice = false;
		// 地の文は一行目が改行されてる
		//output = "\n"+text_space + output;
		output = "\n"+text_space_one + output;
		
		cnt = text_space.length;
		// 元々入ってる先頭の全角空白はカットされてるので
		// 先頭に空白追加
		//text = text_space_one+text;
	}
	
	var escape_text = false;
	
	// ArrayのforEachを借りる
	for(var t_cnt=0, length=text.length; t_cnt<length; t_cnt++){
		var c=text[t_cnt];
		
		if(c == "\\") escape_text = true
		if(escape_text){
			escape_text = c.match(this.ESCAPE()) != null ? true : false
		}
		
		
		if(voice){
			// まだ名前の部分
			if( text_len < cnt ){
				// 名前の文字数を超えた
				voice = false;
				cnt = 0;
			}
		}
		if( !voice && cnt >= this.VIEW_TEXT_NUM ){
			// 文字数は表示サイズを超えた
			if( this.FOLLOWING.indexOf(c) != -1 ){
				// 行頭禁止文字の場合は改行しない
				output += c;
			}else{
				output += "\n"+text_space+c;
				cnt = text_space.length;
			}
		}else if( c == "\\" && text[t_cnt+1] && text[t_cnt+1]=='n' ){
			// 改行コードが入っている場合
			output += "\n"+text_space;
			cnt = text_space.length;
			t_cnt++;
		}else{
			output += c;
		}
		// 制御文字はカウントしない
		if(!escape_text){
			cnt++;
		}
		
	};
	
	// 最後に文頭にスペース追加
	//output = text_f_space+output;
	
	return output;
}


// 終了待ちのタイプ
ADV_System.prototype.updateWait = function() {
	var waiting = false;
	switch (this.mWaitMode) {
		case 'message':
			waiting = $gameMessage.isBusy();
			break;
		case 'transfer':
			waiting = $gamePlayer.isTransferring();
			break;
		case 'scroll':
			waiting = $gameMap.isScrolling();
			break;
		case 'route':
			waiting = this.mWaitData.isMoveRouteForcing();
			break;
		case 'animation':
			waiting = this.mWaitData.isAnimationPlaying();
			break;
		case 'balloon':
			waiting = this.mWaitData.isBalloonPlaying();
			break;
		case 'gather':
			waiting = $gamePlayer.areFollowersGathering();
			break;
		case 'action':
			waiting = BattleManager.isActionForced();
			break;
		case 'video':
			waiting = Graphics.isVideoPlaying();
			break;
		case 'image':
			waiting = !ImageManager.isReady();
			break;
	}
	if (!waiting) {
		this.mWaitMode = '';
		this.mWaitData = null;
	}
	return waiting;
}

// 終了待ち（時間指定）
ADV_System.prototype.updateWaitCount = function() {
	if (this.mWaitCount > 0) {
		this.mWaitCount--;
		return true;
	}
	return false;
}
// 終了待ち時間設定
ADV_System.prototype.wait = function(duration) {
	this.mWaitCount = duration;
}

// ==================================================================
// 補助：画像関係
// ==================================================================

// 画像再生
ADV_System.prototype.loadPicture = function(data) {
	
	var filename = data.f;
	var files = filename.split('@');
	var check_name = this.getCheckName(data);
	
	var pict_data = null;
	if(data.ev){
		// EV
		pict_data = this.findPictureNumber(this.EV_LAYER);
	}else if(data.ev2){
		// EV2
		pict_data = this.findPictureNumber(this.EV2_LAYER);
	}else{
		// BS
		pict_data = this.findPicture(check_name);
	}
	
	
	if( pict_data ){
		// 既に立ち絵を表示していた
		var o_data = data.option;
		
		// 表示済みのPICT番号
		var pict_id_base = pict_data.base_id;
		
		this.mViewPictId = pict_id_base;

		for(var key in pict_data.list){
			
			// 新しい画像は一旦最前面に置く（トランジション処理）
			var old_pict_id = pict_id_base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM[ key ];
			if(data.ev || data.ev2){
				// EV
				var new_pict_id = old_pict_id;
			}else{
				// BS
				var new_pict_id = this.PICT_NEW_LAYER * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM[ key ];
			}
			

			//var new_pict_id = old_pict_id;
			
			var val = pict_data.list[key];
			
			// 変更があるものだけチェンジする
			var change_flag = true;
			var new_pict_name = '';
			var type = '';
			var time = data.t;
			
			switch(key){
				case 'DEFAULT':
					// 表情等必ず入ってる物
					new_pict_name = data.f;
					type = data.f;
					break;
				case 'BODY':
					// 身体画像
					if(o_data){
						type = o_data[key] == null ? '' : o_data[key];
					}
					new_pict_name = files[0]+"_"+type;
					if( (type == '' || type == null) ) change_flag = false;
					break;
				case 'OP':
					// 頬画像
					
					if(o_data){
						type = o_data[key] == null ? '' : o_data[key];
					}
					new_pict_name = files[0]+"_"+type;
					if( type == '' || type == null ){
						// オプション画像は指定が無ければ消す
						new_pict_name = 'void';
					}
					break;
				case 'OP2':
					if(o_data){
						type = o_data[key] == null ? '' : o_data[key];
					}
					new_pict_name = files[0]+"_"+type;
					if( type == '' || type == null ){
						// オプション画像は指定が無ければ消す
						new_pict_name = 'void';
					}
					break;
				default:
					change_flag = false;
					break;
			}
			
			// 前と同じ画像なので画像変更の必要無し
			if( val._name.split('.png')[0] == new_pict_name ) change_flag = false;
			
			// 変更を行わない場合
			if( !change_flag ) new_pict_name = val._name.split('.png')[0];
			
			// 表示座標の指定が無ければ前と同じ座標
			var set_x = val._x - this.BS_BASE_X;
			var set_y = val._y - this.BS_BASE_Y;
			if( data.x != null ) set_x = data.x;
			if( data.y != null ) set_y = data.y;
			
			var new_opa = data.opacity;
			// 画像・座標の変化がない場合は透明度を今と同じ
			if(!change_flag && (set_x +  + this.BS_BASE_X) == val._x && (set_y + this.BS_BASE_Y) == val._y) new_opa = val._opacity;
			
			// 次の画像を新しいレイヤーに表示
			this.showPicture(new_pict_id, new_pict_name, set_x, set_y, 100, 100, new_opa);
			
			// FPSセット
			if(data.fps > 0){
				$gameScreen.picture( new_pict_id ).setFrameRate(data.fps);
			}
			
			// 今表示している画像は消す（トランジション処理）
			if(!(data.ev||data.ev2)){
				// BS
				$gameScreen.movePicture(old_pict_id, 1, val._x, val._y, 100, 100, 0, 0, time);
			}
			
			var load_pict_id = this.PICT_NEW_LAYER;
			
		}
		
	}else{
		// 初めて表示する
		
		// 現在表示済みの立ち絵枚数
		// EVの場合固定
		var pict_id_base = 0;
		if(data.ev){
			// EV
			pict_id_base = this.EV_LAYER;
		}else if(data.ev2){
			// EV
			pict_id_base = this.EV2_LAYER;
		}else{
			// BS
			pict_id_base = this.getPictId();
		}
		
		// 表示座標の確認
		if( data.x == null ) data.x = 0;
		if( data.y == null ) data.y = 0;
		
		if( data.face != "0" && data.face != null){
			// 立ち絵の場合はその他部分（体、頬等）を表示チェック
			var o_data = data.option;
			for (var key in o_data){
				// 存在しないオプション指定
				if( !this.DEFAULT_NAME[key] ) continue;
				
				var val = o_data[key]
				var add_type = val;
				// 空文字等の場合はデフォルト値を入れる
				if( add_type == '' || add_type == null ) add_type = this.DEFAULT_NAME[key];
				
				// 読み込む画像名
				var new_pict_name = files[0]+'_'+add_type;
				// 画像を出したくない場合は空画像
				if( add_type == 'NO' ) new_pict_name = 'void';
				var pict_id = pict_id_base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM[ key ];
				
				// 画像表示
				this.showPicture(pict_id, new_pict_name, data.x, data.y, 100, 100, data.opacity);
				
				// FPSセット
				if(data.fps > 0){
					$gameScreen.picture( pict_id ).setFrameRate(data.fps);
				}
			}
		}
		
		// 立ち絵の表情又はカットイン等の一枚絵を表示
		var pict_id = pict_id_base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM.DEFAULT;
		this.showPicture(pict_id, filename, data.x, data.y, 100, 100, data.opacity);
		// FPSセット
		if(data.fps > 0){
			$gameScreen.picture( pict_id ).setFrameRate(data.fps);
		}
		
		// 使用済みにする
		this.mPictId[pict_id_base] = true;
		
		var load_pict_id = pict_id_base;
		
	}
	
	// 今表示したキャラを最前列に持ってくる
	if(!(data.ev||data.ev2)){
		// BS
		this.mViewPictId = this.swapPicture(pict_id_base);
	}
	
	return load_pict_id;
	
}

// 画像移動
ADV_System.prototype.movePicture = function(data) {

	// 検索用の名前
	var check_name = data.f;
	if ( check_name.indexOf("@") != -1 )
	{
		check_name = check_name.split('@');
		check_name = check_name[0] + '@';
	}
	// 画像を取得
	var pict_data = this.findPicture(check_name);
	
	// 画像が読み込め無かった
	if( pict_data == null ) return;
	
	// 画像ID
	var pict_id_base = pict_data.base_id;
	
	// 画像の中心点を基準に表示しているので補正
	data['x'] += this.BS_BASE_X;
	data['y'] += this.BS_BASE_Y;
	
	// セットする値
	var set_time = data.t;
	for(var key in pict_data.list){
		var val = pict_data.list[key];
		// セットする値
		var set_x = 0;
		var set_y = 0;
		var set_opa = data['opa'];
		var set_width  = data['width'];
		var set_height = data['height'];
		if( data.abs ){
			// 絶対座標
			set_x = data['x'];
			set_y = data['y'];
		}else{
			// 相対座標
			set_x = val._x + data['x'];
			set_y = val._y + data['y'];
		}
		var pict_id = pict_id_base*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
		
		$gameScreen.movePicture(pict_id, 1, set_x, set_y, set_width, set_height, set_opa, 0, set_time);
	}
}

// 画像移動＆フェード
ADV_System.prototype.moveFadePicture = function(data) {
	
	
	if( data.new ){
		// 画像も一緒に読み込む
		
		var afterOpacity = data['opacity'];
		
		data['x'] = data['ox'];
		data['y'] = data['oy'];
		data['opacity'] = data.type == 'in' ? 0 : 255;
		
		var load_pict_id = this.loadPicture(data);
		
		// 一応入れ替え
		if(load_pict_id == this.PICT_NEW_LAYER ){
			this.swapLayer( this.PICT_NEW_LAYER, this.mViewPictId );
			this.deletePicture(this.PICT_NEW_LAYER);
		}
		this.mViewPictId = -1;
		
		
		data['opacity'] = afterOpacity;
	}
	
	
	// 検索用の名前
	var check_name = this.getCheckName(data);
	
	// 画像を取得
	var pict_data = this.findPicture(check_name);
	
	// 画像が読み込め無かった
	if( pict_data == null ) return;
	
	// 画像ID
	var pict_id_base = pict_data.base_id;
	
	// セットする値
	var set_op = data.type == 'in' ? data.opacity : 0;
	
	for(var key in pict_data.list){
		var val = pict_data.list[key];
		var set_time = data.t;
		
		// セットする値
		var set_x = val._x + data['mx'];
		var set_y = val._y + data['my'];
		var pict_id = pict_id_base*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
		
		
		$gameScreen.movePicture(pict_id, 1, set_x, set_y, 100, 100, set_op, 0, set_time);
	}
	
}

// 画像移動後に呼び出される処理
ADV_System.prototype.moveAfterPicture = function(pict) {
	if( this.mViewPictId == -1 ) return;
	var new_pict_data = this.findPictureNumber(this.PICT_NEW_LAYER);
	if(new_pict_data.list != null){
		this.swapLayer( this.PICT_NEW_LAYER, this.mViewPictId );
		this.deletePicture(this.PICT_NEW_LAYER);
		
		// 画像のリロードを行う
		var pict_data = this.findPictureNumber(this.mViewPictId);
		var pict_id_base = pict_data.base_id;
		for(var key in pict_data.list){
			var pict_id = pict_id_base*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
			
			$gameScreen.picture(pict_id).setReload(true);
		}
	}
	this.mViewPictId = -1;
	// トランジション削除
	this.mTrans = false;
}

// 表示画像を最前面まで持ってくる
ADV_System.prototype.swapPicture = function(pid) {
	var lay_add = this.ADD_LAYER_NUM.BASE;
	var i = pid
	for( ; i<this.PICT_MAX; i++){
		// 今のIDより大きい数が無ければループ脱出
		if(!this.mPictId[i+1]) break;
		// レイヤー入れ替え
		this.swapLayer(i,i+1);
	}
	return i;
}

// 表示画像を最前面まで持ってくる
ADV_System.prototype.swapLayer = function(id1,id2) {
	var lay_add = this.ADD_LAYER_NUM.BASE;
	for (var key in this.ADD_LAYER_NUM){
		if( key == 'BASE' ) continue;
		var lay1 = (id1 * lay_add) + this.ADD_LAYER_NUM[key];
		var lay2 = (id2 * lay_add) + this.ADD_LAYER_NUM[key];
		$gameScreen._pictures[lay1] = $gameScreen._pictures[lay1] || null;
		$gameScreen._pictures[lay2] = $gameScreen._pictures[lay2] || null;
		var temp = $gameScreen._pictures[lay1];
		$gameScreen._pictures[lay1] = $gameScreen._pictures[lay2];
		$gameScreen._pictures[lay2] = temp;
	}
}

// 画像削除（-1指定で全削除）
ADV_System.prototype.deletePicture = function(pid) {
	
	if( typeof pid == 'string' ){
		// 文字列が入ってる場合はファイル名が指定されてる
		while (true){
			var pict_data = this.findPicture(pid);
			if( pict_data ){
				// IDを渡す
				this.deletePicture(pict_data.base_id);
			}else{
				break;
			}
		}
		
		
		return;
	}
	
	// 全削除か判定
	if( pid == -1 ){
		
		// 背景
		$gameScreen.erasePicture(this.BG_PICT_ID);
		
		for(var i=0 ; i<this.PICT_MAX; i++){
			if(!this.mPictId[i]) continue;
			var base = i;
			for (var key in this.DEFAULT_NAME){
				var pict_id = base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM[ key ];
				$gameScreen.erasePicture(pict_id);
			}
			
			var pict_id = base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM.DEFAULT;
			$gameScreen.erasePicture(pict_id);
			
			// 未使用に戻す
			this.mPictId[base] = false;
			
		}
	}else{
		var base = pid;
		for(var key in this.DEFAULT_NAME){
			var pict_id = base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM[ key ];
			$gameScreen.erasePicture(pict_id);
		}
		var pict_id = base * this.ADD_LAYER_NUM.BASE + this.ADD_LAYER_NUM.DEFAULT;
		$gameScreen.erasePicture(pict_id);
		
		// 未使用に戻す
		this.mPictId[base] = false;
	}
}

// 画像表示
ADV_System.prototype.showPicture = function(id,name,x,y,scaleX,scaleY,opacity) {
	// 画像の中心点を基準に表示しているので補正
	x += this.BS_BASE_X;
	y += this.BS_BASE_Y;
	// オリジナルファイル名
	//name += '.png';
	$gameScreen.showPicture(id, name, 1, x, y, scaleX, scaleY, opacity, 0);
}

// 画像検索
ADV_System.prototype.findPicture = function(name) {
	var list = $gameScreen._pictures;
	var output = null;
	var hit = -1;
	
	// 配列検索
	// 番号が上の方が新しいので降順で検索
	//for(var i=0, length=list.length; i<length; i++){
	for(var i=list.length-1; i>0; i--){
		var picture = list[i];
		if( picture ){
			if( picture._name.indexOf(name) != -1 ){
				hit = i;
				break;
			}
		}
	}
	
	if( hit != -1 ){
		
		// 表情IDから、ベースのIDを求める
		hit = Math.floor( hit / this.ADD_LAYER_NUM.BASE );
		
		// 関連する画像を引っ張ってくる
		output = { base_id:hit, list:{} };
		
		for(var key in this.ADD_LAYER_NUM){
			if( key == 'BASE' ) continue;
			var pict_id = hit*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
			if( $gameScreen._pictures[pict_id] ) output.list[key] = $gameScreen._pictures[pict_id];
		}
		
	}
	
	return output;
}

// 画像検索（ピクチャのIDから探す）
ADV_System.prototype.findPictureID = function(id) {
	var output = null;
	
	if( id != -1 ){
		
		// 表情IDから、ベースのIDを求める
		id = Math.floor( id / this.ADD_LAYER_NUM.BASE );
		
		// 関連する画像を引っ張ってくる
		output = { base_id:id, list:{} };
		
		for(var key in this.ADD_LAYER_NUM){
			if( key == 'BASE' ) continue;
			var pict_id = id*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
			if( $gameScreen._pictures[pict_id] ) output.list[key] = $gameScreen._pictures[pict_id];
		}
		
	}
	
	return output;
}

// 画像検索（レイヤーのナンバーから探す）
ADV_System.prototype.findPictureNumber = function(id) {
	var output = null;
	
	if( (id != -1 && this.mPictId[id]) || id == this.PICT_NEW_LAYER ){
		
		// 関連する画像を引っ張ってくる
		output = { base_id:id, list:null };
		
		for(var key in this.ADD_LAYER_NUM){
			if( key == 'BASE' ) continue;
			var pict_id = id*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
			if( $gameScreen._pictures[pict_id] ){
				output.list = output.list || {};
				output.list[key] = $gameScreen._pictures[pict_id];
			}
		}
		
	}
	
	return output;
}

// 画像用のID取得
ADV_System.prototype.getPictId = function() {
	var output = 0;
	for(var i=1 ; i<this.PICT_MAX; i++){
		if(this.mPictId[i]) continue;
		output = i;
		break;
	}
	
	return output;
}

// 判定用の名前取得
ADV_System.prototype.getCheckName = function(data) {
	var output = data.f.split('@')[0];
	if( data.face != '0' ) output += '@';
	return output;
}

// ==================================================================
// ADVシステムで使用する処理
// ==================================================================

// 回想モード開始
ADV_System.prototype.replayStart = function() {
	if( this.mReplayMode ){
		this.start( this.mReplayMode );
		this.mReplayMode = null;
	}
}	

// 更新部分
ADV_System.prototype.update = function() {
	
	// システム実行中じゃない
	if( !this.mRun ) return false;
	
	// 何かの処理待ち中
	if( this.updateWaitCount() || this.updateWait() ) return true;
	
	this.stackRun();
	return true;
}


// シナリオファイル再生開始
ADV_System.prototype.start = function(filename,reset) {
	
	// プリロードカウントリセット
	this.mPlCnt = 0;
	
	//*********************************
	// デバッグ用
	// 現在時刻の表示
	// var date = new Date();
	// var date_str = [ date.getFullYear(), date.getMonth() + 1, date.getDate() ].join('/') + ' ' + [ ( '0' + date.getHours() ).slice( -2 ), ( '0' + date.getMinutes() ).slice( -2 ), ( '0' + date.getSeconds() ).slice( -2 ) ].join(':');
	// console.log('scenario load : ' + date_str + ' : '+filename+'.txt');
	//var date_str = process.argv[0].split('\\');
	//if (date_str.length < 1) {
	//	date_str = process.argv[0].split('/');
	//}
	//date_str = process.argv[0].substring(0, process.argv[0].length - date_str[date_str.length - 1].length);
	//window.alert(date_str);
	//*********************************
	
	// 指定がない場合はリセット
	if( reset === undefined ) reset = true;
	// スタックの保存先リセット
	if( reset ) this.resetStack();
	
	// ファイル読み込み
	var file_data = this.fileLoad(filename);
	// 読み込んだシナリオを配列に入れる
	var s_list = file_data.split('\n');
	
	// 今回のファイルのスタック
	var new_stack = [];
	
	// =======================================================
	// テキストファイルループ開始
	for(var i=0, len=s_list.length; i<len; i++){
		var text = s_list[i];
		// 空の文字列
		text = this.chomp(text);
		text = text.trim();
		if( text.trim() == "" || text.trim() == '\r' ) continue;
		// コメント
		if( text.charAt(0) == ';' ) continue;
		
		// 追加する物
		var add_stack = [];
		
		// 命令文の判定
		if( text.charAt(0) == '@' ){
			// マクロ
			add_stack = this.macroChange( this.chomp(text) );
		}else if( text.charAt(0) == '*' ){
			// ラベル
			add_stack = this.macroChange( this.chomp(text) );
		}else{
			// テキスト
			var add_text = text;
			
			// 音声ファイル抜き出し
			if( add_text.indexOf('/') != -1 ){
				// @voiceマクロを入れる
				var voice = add_text.slice(add_text.indexOf('/')+1,add_text.indexOf(']'));
				add_stack.push( '@voice f='+voice );
			}
			
			// ボイス名を削除
			add_text = this.nameVoiceCut(add_text);
			
			
			
			add_text = this.viewMesAdjust(add_text);
			
			add_stack.push(add_text);
		}
		
		new_stack = new_stack.concat(add_stack);
		//this.mStack.push(text);
		
	}
	// ループ終了
	// =======================================================
	
	// 残っているスタックとの統合
	this.mStack = new_stack.concat(this.mStack);
	
	// リセット命令が無ければ実行中なので新しく開始する必要が無い
	if( reset ){
		// 実行開始
		this.mRun = true;
		$gameMap._interpreter.setAdvRun(true);
		
		// 処理開始
		this.stackRun();
	}
}

// シナリオファイル再生開始
ADV_System.prototype.fileLoad = function(filename) {
	var fs = require('fs');//var date_str = process.argv[0].split('\\');
	var filepath = this.localFileDirectoryPath()+filename+'.txt';
	var file_data = fs.readFileSync(filepath, 'utf-8');
	
	return file_data;
}

// スタックのテキスト表示
ADV_System.prototype.viewMessage = function() {
	
	var text = this.mStack.shift();
	this.mLastMessage = text;
	
	// メッセージの設定は毎回入れないと行けない
	$gameMessage.setBackground(this.mWindowBack);
	$gameMessage.setPositionType(this.mWindowPos);
	
	// メッセージ表示
	$gameMessage.add(text);
	
	// 次のスタックが「選択肢」「数値入力」「アイテム選択」
	// の場合は一緒に表示する
	var stack = this.mStack[0]; 
	if( stack && ( stack.indexOf('@select') != -1 ) ){
		this.stackRun();
	}
	
	this.mWaitMode = 'message';
}

// テキストの状態をセーブ
ADV_System.prototype.messageSave = function() {
	this.mStack.unshift(this.mLastMessage);
	
}

// スタックのマクロ表示
ADV_System.prototype.viewMacro = function() {
	
	var macro = this.mStack.shift();
	
	// マクロ実行
	this.macroRun(macro);
	
}

// スタックを走らせる
ADV_System.prototype.stackRun = function() {
	
	if( !this.mRun ) return;
	// 現在のスタック確認
	var stack = this.mStack[0];
	
	// ラベルの部分を飛ばす
	while( stack && stack.charAt(0) == '*' ){
		this.mStack.shift();
		stack = this.mStack[0];
	}
	
	// スタックが無い
	if( !stack ){
		// ウィンドウ設定リセット
		this.resetMesOption();
		// スクリプト終了
		this.mLastMessage = null;
		this.mRun = false;
		$gameMap._interpreter.setAdvRun(false);
		
		// 戦闘中はターン開始（RRR企画用）
		if($gameParty.inBattle()){
			//SceneManager._scene.startPartyCommandSelection();
			// 戦闘用画面表示
			//SceneManager._scene.statusWindowView(true);
		}
		
		return;
	}
	
	if( stack.charAt(0) == '@' ){
		// マクロ
		this.viewMacro();
	}else{
		// テキスト
		this.viewMessage();
	}
}

// 指定のラベルまでスタックを無視する
ADV_System.prototype.jumpLabel = function(label) {
	var stack = this.mStack[0];
	// 指定ラベルまで飛ばす
	while( stack && stack != label ){
		this.mStack.shift();
		stack = this.mStack[0];
	}
}


// マクロを処理する
ADV_System.prototype.macroRun = function(macro) {
	
	// 改行削除
	//macro = this.chomp(macro);
	
	// マクロで使用する引数用配列
	var argument = {};
	
	//console.log("macro:"+macro);
	//************************************************************
	// ADV演出系
	//************************************************************
	if( macro.indexOf('@bs ') != -1 ){
		//======================================
		// 立ち絵再生
		//======================================
		// デフォルト値も指定
		argument = this.makeArg(macro,{opa:255, face:1, t:this.BS_TRANS_TIME});
		
		if( argument['x'] == 'c' ){
			argument['x'] = this.BS_C;
		}else if( argument['x'] == 'l' ){
			argument['x'] = this.BS_L;
		}else if( argument['x'] == 'r' ){
			argument['x'] = this.BS_R;
		}
		
		// 数値に戻す（型変換）
		if( argument['x'] != null ) argument['x'] = Number(argument['x']);
		if( argument['y'] != null ) argument['y'] = Number(argument['y']);
		argument['opacity'] = Number(argument['opa']);
		
		// 服装を反映
		if( !argument['body'] && argument['f'] ){
			// 服装の指定が無い場合は今表示中の画像に合わせる
			var check_name = this.getCheckName(argument);
			var pict_data = this.findPicture(check_name);
			if( pict_data ){
				var body_name = pict_data.list.BODY._name.split('.png')[0];
				argument['body'] = body_name.split('_')[1];
			}else{
				var name = argument['f'].split('@')[0];
				argument['body'] = this.getBodyCos(name,true);
			}
		}
		
		// 身体の名前を一旦保存
		if(argument['face'] == 0){
			argument['body'] = '';
		}
		var body_name = argument['body'];
		
		// 服装の破れや、ズームでの使用
		if( argument['body_op'] ){
			var result = this.changeBodyCos(argument['body'], argument['body_op']);
			argument['body'] = result.cos;
		}
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// ファイル名がない場合は「@bs」と同じ
		if( argument['f'] == null ){
			this.deletePicture(-1);
		}else if( argument['f'].lastIndexOf('@') == argument['f'].length-1 ){
			// 画像削除指定
			this.deletePicture(argument['f']);
		}else{
			
			/*
			// 立ち絵表示を戻す
			var name = argument['f'].split('@')[0];
			// 服装によって表情画像が変わる
			if( this.CHANGE_FACE[name] && this.CHANGE_FACE[name].indexOf( body_name ) != -1 ){
				argument['f'] = argument['f'].replace('@','@'+body_name+'_');
			}
			
			// 画像読み込み
			this.loadPicture(argument);
			*/
			
			//（トランジション処理）
			
			// 既に表示中のデータを確認
			var check_name = this.getCheckName(argument);
			
			var old_pict_data = this.findPicture(check_name);
			
			// 今から表示する画像
			var name = argument['f'].split('@')[0];
			// 服装によって表情画像が変わる
			if( this.CHANGE_FACE[name] && this.CHANGE_FACE[name].indexOf( body_name ) != -1 ){
				argument['f'] = argument['f'].replace('@','@'+body_name+'_');
			}
			
			/*
			// JKRPG専用
			var actor = TS_Function.getActor(name);
			if(actor){
				// 装飾反映
				if(argument['f'].indexOf('_z') == -1){
					if(actor._mDec != '' && TS_GameConfig.CheckDecCos.indexOf(argument['body']) != -1 ){
						argument['body'] += '_' + actor._mDec;
					}
				}
				
				// 髪色を反映
				var hair_name = actor.getHairName();
				if(hair_name != ''){
					if(argument['f'].indexOf('_z') != -1){
						argument['f'] = argument['f'].replace('_z',hair_name + '_z');
						argument['body'] = argument['body'].replace('_z',hair_name + '_z');
					}else{
						argument['f'] = argument['f'] + hair_name;
						argument['body'] = argument['body'] + hair_name;
					}
				}
				
			}
			*/
			// JKRPG専用
			if(argument['h']){
				var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
				if(actor){
					
					// 髪色を反映
					var hair_name = actor.getHairName();
					if(hair_name != ''){
						if(argument['f'].indexOf('_z') != -1){
							argument['f'] = argument['f'].replace('_z',hair_name + '_z');
							argument['body'] = argument['body'].replace('_z',hair_name + '_z');
						}else{
							argument['f'] = argument['f'] + hair_name;
							argument['body'] = argument['body'] + hair_name;
						}
					}
				}
			}
			if(argument['cos']){
				var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
				if(actor){
					
					// 服装チェック
					var hair_name = actor.getHairName();
					if(actor._mCos == '制服'){
						argument['f'] = argument['f'] + '_制服';
					}
				}
			}
			
			// オプション系を入れる
			argument.option = {
				BODY    : argument['body'],
				//BODY_OP : argument['body_op'],// 服装の破れ等で使用していたが必要か不明
				OP      : argument['op'],
				OP2     : argument['op2'],
			}
			
			var opacity = argument['opacity'];
			argument['opacity'] = 0;
			
			// トランジション中の画像がある場合は強制終了
			if( this.mTrans ){
				var delete_pict = this.findPictureNumber(this.mViewPictId);
				if(delete_pict){
					// 切り替えを終わらせる
					delete_pict.list.BODY.mAfterFunk = undefined;
					this.moveAfterPicture(delete_pict);
				}else{
					console.log("エラー");
				}
			}
			
			// 画像読み込み（一旦透明状態で表示）
			this.loadPicture(argument);
			
			// 画像を取得
			var check_name = this.getCheckName(argument);
			var pict_data = this.findPicture(check_name);
			// 画像ID
			var pict_id_base = pict_data.base_id;
			// セットする値
			var set_time = argument['t'];
			for(var key in pict_data.list){
				var val = pict_data.list[key];
				// セットする値
				var pict_id = pict_id_base*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
				$gameScreen.movePicture(pict_id, 1, val._x, val._y, 100, 100, opacity, 0, set_time);
			}
			
			// 古い画像がある場合
			/*
			if(old_pict_data){
				
				// 画像ID
				var old_pict_id_base = old_pict_data.base_id;
				// セットする値
				var set_time = argument['t'];
				for(var key in old_pict_data.list){
					var val = old_pict_data.list[key];
					// セットする値
					var pict_id = old_pict_id_base*this.ADD_LAYER_NUM.BASE+this.ADD_LAYER_NUM[key];
					$gameScreen.movePicture(pict_id, 1, val._x, val._y, 100, 100, 0, 0, set_time);
				}
				
				// 移動完了後の関数を入れてみる
				old_pict_data.list.BODY.mAfterFunk = function(pict){
					$advSystem.moveAfterPicture(pict);
				};
				
				// トランジション開始
				this.mTrans = true;
				
				console.log("トランジション");
			}
			*/
			// 移動完了後の関数を入れてみる
			if(pict_data.list.BODY){
				pict_data.list.BODY.mAfterFunk = function(pict){
					$advSystem.moveAfterPicture(pict);
					return undefined;
				};
				// トランジション開始
				this.mTrans = true;
			}
		}
		
		// ウェイトを入れる
		if( argument['t'] > 0 ){
			this.wait(argument['t']);
		}
		
		// ウェイトを入れる
		this.mWaitMode = 'image';
		
	}else if( macro == '@bs' ){
		//======================================
		// 立ち絵再生　終了
		//======================================
		// 画像全削除
		this.deletePicture(-1);
		
	}else if( macro.indexOf('@bs_del ') != -1 ){
		//======================================
		// 立ち絵再生　終了
		//======================================
		argument = this.makeArg(macro,{});
		if( argument['f'] != null ){
			// 画像削除指定
			this.deletePicture(argument['f']);
		}
	}else if( macro.indexOf('@move ') != -1 ){
		//======================================
		// 移動
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{x:0, y:0, opa:255, t:1000, wt:0, abs:1, w:100, h:100});
		
		// ファイル名は必ず必要
		if( argument['f'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['opa'] = Number(argument['opa']);
		argument['abs'] = argument['abs'];
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		argument['width'] = Number(argument['w']);
		argument['height'] = Number(argument['h']);
		
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// 画像移動
		this.movePicture(argument);
		
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
		
	}else if( macro.indexOf('@move_f ') != -1 ){
		//======================================
		// 移動＆フェード
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{opacity:255, ox:0, oy:0, mx:0, my:0, t:500, type:"in", new:0, wt:1, face:1});
		
		// ファイル名は必ず必要
		if( argument['f'] == null ) return;
		
		// 省略系
		if( argument['in'] ){
			argument['type'] = 'in';
			argument['new'] = 1;
			switch(argument['in']){
				case 'r':
					argument['ox'] = this.BS_R + this.BS_MOVE;
					argument['mx'] = this.BS_MOVE * -1;
					break;
				case 'l':
					argument['ox'] = this.BS_L - this.BS_MOVE;
					argument['mx'] = this.BS_MOVE;
					break;
			}
		}
		
		// 省略系
		if( argument['out'] ){
			argument['type'] = 'out';
			switch(argument['out']){
				case 'r':
					argument['mx'] = this.BS_MOVE;
					break;
				case 'l':
					argument['mx'] = this.BS_MOVE * -1;
					break;
			}
		}
		
		// 数値に戻す（型変換）
		argument['ox'] = Number(argument['ox']);
		argument['oy'] = Number(argument['oy']);
		argument['mx'] = Number(argument['mx']);
		argument['my'] = Number(argument['my']);
		argument['new'] = Number(argument['new']);
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		
		
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// 服装を反映
		if( !argument['body'] && argument['f'] ){
			var name = argument['f'].split('@')[0];
			argument['body'] = this.getBodyCos(name,true);
		}
		
		// 身体の名前を一旦保存
		var body_name = argument['body'];
		var name = argument['f'].split('@')[0];
		// 服装によって表情画像が変わる
		if( this.CHANGE_FACE[name] && this.CHANGE_FACE[name].indexOf( body_name ) != -1 ){
			argument['f'] = argument['f'].replace('@','@'+body_name+'_');
		}
		
		
		// 服装の破れや、ズームでの使用
		if( argument['body_op'] ){
			var result = this.changeBodyCos(argument['body'], argument['body_op']);
			argument['body'] = result.cos;
		}
		
		/*
		// JKRPG専用
		var actor = TS_Function.getActor(name);
		if(actor){
			// 装飾反映
			if(argument['f'].indexOf('_z') == -1){
				if(actor._mDec != '' && TS_GameConfig.CheckDecCos.indexOf(argument['body']) != -1 ){
					argument['body'] += '_' + actor._mDec;
				}
			}
			
			// 髪色を反映
			var hair_name = actor.getHairName();
			if(hair_name != ''){
				if(argument['f'].indexOf('_z') != -1){
					argument['f'] = argument['f'].replace('_z',hair_name + '_z');
					argument['body'] = argument['body'].replace('_z',hair_name + '_z');
				}else{
					argument['f'] = argument['f'] + hair_name;
					argument['body'] = argument['body'] + hair_name;
				}
			}
			
		}
		*/
		
		// JKRPG専用
		if(argument['h']){
			var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
			if(actor){
				
				// 髪色を反映
				var hair_name = actor.getHairName();
				if(hair_name != ''){
					if(argument['f'].indexOf('_z') != -1){
						argument['f'] = argument['f'].replace('_z',hair_name + '_z');
						argument['body'] = argument['body'].replace('_z',hair_name + '_z');
					}else{
						argument['f'] = argument['f'] + hair_name;
						argument['body'] = argument['body'] + hair_name;
					}
				}
			}
		}
		if(argument['cos']){
			var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
			if(actor){
				
				// 服装チェック
				var hair_name = actor.getHairName();
				if(actor._mCos == '制服'){
					argument['f'] = argument['f'] + '_制服';
				}
			}
		}
		
		
		// オプション系を入れる
		argument.option = {
			BODY    : argument['body'],
			//BODY_OP : argument['body_op'],// 服装の破れ等で使用していたが必要か不明
			OP      : argument['op'],
			OP2     : argument['op2'],
		}
		
		// 画像移動＆フェード
		this.moveFadePicture(argument);
		
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
		
		// ウェイトを入れる
		this.mWaitMode = 'image';
		
		// 削除の場合は削除処理も追加する
		if( argument['type'] == 'out' ){
			var name = argument['f'].split('@');
			name = name[0];
			if( argument['face'] != '0' ) name = name + '@';
			this.macroAdd( '@bs_del f='+name );
		}
		
	}else if( macro.indexOf('@bg ') != -1 ){
		//======================================
		// 背景再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{x:0, y:0, opacity:255});
		
		// EVを表示する際は一旦画像を全部消す
		//this.deletePicture(-1);
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['opacity'] = Number(argument['opacity']);
		
		// ファイル名がない場合は「@bg」と同じ
		if( argument['f'] == null ){
			this.deletePicture(-1);
		}else{
			// 画像読み込み
			this.showPicture(this.BG_PICT_ID, argument.f, argument.x, argument.y, 100, 100, argument.opacity);
		}
		
	}else if( macro == '@bg' ){
		//======================================
		// 背景削除
		//======================================
		
		// 背景
		$gameScreen.erasePicture(this.BG_PICT_ID);
		
	}else if( macro.indexOf('@cg_set ') != -1 ){
		//======================================
		// CGに登録
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{});
		
		// ファイル名は必須
		if( argument['f'] == null ){
			return;
		}
		
		// 回想に登録
		$CommonSave.set(argument['f'],true);
		
	}else if( macro.indexOf('@ev ') != -1 ){
		//======================================
		// CG再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{x:0, y:0, opacity:255, face:0, del:0});
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['del'] = Number(argument['del']);
		argument['opacity'] = Number(argument['opacity']);
		
		// EVを表示する際は一旦画像を全部消す
		//this.deletePicture(-1);
		
		// ファイル名がない場合は「@bs」と同じ
		if( argument['f'] == null ){
			this.deletePicture(-1);
		}else if( argument['del'] == 1 ){
			// 画像削除指定
			this.deletePicture(argument['f']);
		}else{
			
			// 処女指定
			if( argument['v'] ){
				if( $gameSwitches.value(TS_GameConfig.argRpModeSwi) ){
					// 回想時
					if( $gameSwitches.value(TS_GameConfig.argRpVirginSwi) ){
						argument['f'] += '_v';
					}
				}else{
					// 通常時
					if( !$gameSwitches.value(TS_GameConfig.argVirginSwi) ){
						argument['f'] += '_v';
					}
				}
			}
			
			// 装飾
			if( argument['dec'] ){
				var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
				if(actor._mDec != ''){
					argument['f'] += '_' + actor._mDec;
				}
			}
			
			// 回想にも登録
			$CommonSave.set(argument['f'],true);
			
			// 再生するCGを髪色によって変える
			if( argument['f'].indexOf('ev') !=-1 ){
				var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
				if(actor){
					var hair_name = actor.getHairName();
					if(hair_name != ''){
						argument['f'] += hair_name;
					}
				}
			}
			
			// EVレイヤー
			argument['ev'] = true;
			
			
			// 画像読み込み
			this.loadPicture(argument);
			
			// ウェイトを入れる
			this.mWaitMode = 'image';
		}
		
	}else if( macro == '@ev' ){
		//======================================
		// CG削除
		//======================================
		// 画像全削除
		this.deletePicture( this.EV_LAYER );
	}else if( macro.indexOf('@ev2 ') != -1 ){
		//======================================
		// CG再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{x:0, y:0, opacity:255, face:0, del:0});
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['del'] = Number(argument['del']);
		argument['opacity'] = Number(argument['opacity']);
		
		// EVを表示する際は一旦画像を全部消す
		//this.deletePicture(-1);
		
		// ファイル名がない場合は「@bs」と同じ
		if( argument['f'] == null ){
			this.deletePicture(-1);
		}else if( argument['del'] == 1 ){
			// 画像削除指定
			this.deletePicture(argument['f']);
		}else{
			
			// EVレイヤー
			argument['ev2'] = true;
			
			
			// 画像読み込み
			this.loadPicture(argument);
			
			// ウェイトを入れる
			this.mWaitMode = 'image';
		}
		
	}else if( macro == '@ev2' ){
		//======================================
		// カットイン削除
		//======================================
		// 画像削除
		this.deletePicture( this.EV2_LAYER );
	}else if( macro.indexOf('@ev_anime ') != -1 ){
		//======================================
		// スプライトシート再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{x:0, y:0, opacity:255, fps:1, face:0});
		
		// ファイル名がない場合は削除
		if( argument['f'] == null ){
			this.deletePicture(-1);
			return;
		}
		
		if(!this.isAnimation()){
			var file_name = argument['f'];
			file_name = file_name.slice(2);
			var ev_macro = '@ev f='+file_name;
			if( argument['v'] ) ev_macro += ' v=' + argument['v'];
			this.macroAdd( ev_macro );
			return;
		}
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['opacity'] = Number(argument['opacity']);
		argument['fps'] = Number(argument['fps']);
		
		// 立ち絵ではない
		//argument['face'] = '0';
		
		// 分割数は必ず必要
		if( argument['sx'] == null || argument['sy'] == null ) return;
		
		// 分割設定
		$gameScreen.setPictureSpriteSheetSize( argument['sx'], argument['sy'] );
		
		// 処女指定
		if( argument['v'] ){
			if( $gameSwitches.value(TS_GameConfig.argRpModeSwi) ){
				// 回想時
				if( $gameSwitches.value(TS_GameConfig.argRpVirginSwi) ){
					argument['f'] += '_v';
				}
			}else{
				// 通常時
				if( !$gameSwitches.value(TS_GameConfig.argVirginSwi) ){
					argument['f'] += '_v';
				}
			}
		}
		
		// 回想に登録
		var set_cg = argument['f'];
		set_cg = set_cg.slice(2);
		$CommonSave.set(set_cg,true);
		
		// 再生するCGを髪色によって変える
		if( argument['f'].indexOf('ev') !=-1 ){
			var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
			if(actor){
				var hair_name = actor.getHairName();
				if(hair_name != ''){
					argument['f'] += hair_name;
				}
			}
		}
		// EVレイヤー
		argument['ev'] = true;
		// 画像読み込み
		this.loadPicture(argument);
		
		// ウェイトを入れる
		this.mWaitMode = 'image';
		
	}else if( macro == '@flash' ){
		//======================================
		// フラッシュ（デフォルト）
		//======================================
		
		// デフォルト値を指定
		argument['t'] = 1000;
		argument['col'] = [255, 255, 255, 255];
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// 再生開始
		$gameScreen.startFlash(argument['col'],argument['t']);
		
		// ウェイトを入れる
		this.wait(argument['t']);
		
	}else if( macro.indexOf('@flash ') != -1 ){
		//======================================
		// フラッシュ（指定）
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{t:1000, col:'255,255,255,255', wt:0});
		
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		
		argument['col'] = argument['col'].split(',');
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// 再生開始
		$gameScreen.startFlash(argument['col'],argument['t']);
		
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
		
	}else if( macro.indexOf('@voice ') != -1 ){
		//======================================
		// ボイス再生（SEを利用）
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{pan:0, pitch:100, vol:90});
		
		// 数値に戻す（型変換）＆正しい名前にする
		argument['name'] = argument['f'];
		argument['pitch'] = Number(argument['pitch']);
		argument['volume'] = Number(argument['vol']);
		
		// 現在再生中のボイスは止める
		AudioManager.stopVoice();
		
		if( argument['name'] ){
			// ファイル名が指定されている
			AudioManager.playVoice(argument);
		}
	}else if( macro.indexOf('@me ') != -1 ){
		//======================================
		// 環境音再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{pan:0, pitch:100, vol:90});
		
		// 数値に戻す（型変換）＆正しい名前にする
		argument['name'] = argument['f'];
		argument['pitch'] = Number(argument['pitch']);
		argument['volume'] = Number(argument['vol']);
		
		if( argument['name'] ){
			// ファイル名が指定されている
			AudioManager.playMe(argument);
		}else{
			// ファイル名が指定されていない
			AudioManager.stopMe();
		}
	}else if( macro == '@me' ){
		//======================================
		// 環境音再生　終了
		//======================================
		AudioManager.stopMe();
	}else if( macro.indexOf('@se ') != -1 ){
		//======================================
		// 効果音再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{pan:0, pitch:100, vol:90});
		
		// 数値に戻す（型変換）＆正しい名前にする
		argument['name'] = argument['f'];
		argument['pitch'] = Number(argument['pitch']);
		argument['volume'] = Number(argument['vol']);
		
		if( argument['name'] ){
			// ファイル名が指定されている
			AudioManager.playSe(argument);
			
		}else{
			// ファイル名が指定されていない
			AudioManager.stopSe();
		}
	}else if( macro == '@se' ){
		//======================================
		// 効果音再生　終了
		//======================================
		AudioManager.stopSe();
	}else if( macro.indexOf('@bgm ') != -1 ){
		//======================================
		// BGM再生
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{pan:0, pitch:100, vol:90, t:1000});
		
		// 数値に戻す（型変換）＆正しい名前にする
		argument['name'] = argument['f'];
		argument['pitch'] = Number(argument['pitch']);
		argument['volume'] = Number(argument['vol']);
		
		if( argument['name'] ){
			// ファイル名が指定されている
			AudioManager.playBgm(argument);
		}else{
			// ファイル名が指定されていない
			
			// 数値に戻す（型変換）
			argument['t'] = Number(argument['t']);
			
			// 音声関係は秒数で指定
			argument['t'] = Math.floor(argument['t']/1000);
			AudioManager.fadeOutBgm( argument['t'] );
		}
	}else if( macro.indexOf('@bgm_save') != -1 ){
		//======================================
		// BGM保存
		//======================================
		$gameSystem.saveBgm();
	}else if( macro.indexOf('@bgm_replay') != -1 ){
		//======================================
		// BGM再開
		//======================================
		$gameSystem.replayBgm();
	}else if( macro == '@bgm' ){
		//======================================
		// BGM終了
		//======================================
		// デフォルト値を指定
		argument['t'] = 1000;
		
		// 音声関係は秒数で指定
		argument['t'] = Math.floor(argument['t']/1000);
		AudioManager.fadeOutBgm( argument['t'] );
	}else if( macro.indexOf('@bgv ') != -1 ){
		//======================================
		// BGV再生（BGSを利用）
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{pan:0, pitch:100, vol:90, t:1000});
		
		// 数値に戻す（型変換）＆正しい名前にする
		argument['name'] = argument['f'];
		argument['pitch'] = Number(argument['pitch']);
		argument['volume'] = Number(argument['vol']);
		
		
		if( argument['name'] ){
			// ファイル名が指定されている
			AudioManager.playBgv(argument);
			
			// 直後にボイス等が来ると一時停止が出来ないので少しウェイトを持たせる
			this.wait(50);
		}else{
			// ファイル名が指定されていない
			
			// 数値に戻す（型変換）
			argument['t'] = Number(argument['t']);
			
			// 音声関係は秒数で指定
			argument['t'] = Math.floor(argument['t']/1000);
			AudioManager.fadeOutBgs( argument['t'] );
		}
	}else if( macro == '@bgv' ){
		//======================================
		// BGV終了
		//======================================
		// デフォルト値を指定
		argument['t'] = 1000;
		
		// 音声関係は秒数で指定
		argument['t'] = Math.floor(argument['t']/1000);
		AudioManager.fadeOutBgs( argument['t'] );
	}else if( macro.indexOf('@select ') != -1 ){
		//======================================
		// 選択肢
		// back    :「0：ウィンドウ」「1：暗くする」「2：透明」
		// pos     :「0：左」「1：中」「2：右」
		// default :「0：無し」「1～6：選択肢のID」
		// cancel  :「-2：分岐」「-1：禁止」「0～5：選択肢のID」
		// キャンセル時の「分岐」は保留
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{ back:0, pos:2, default:0, cancel:-1 });
		
		// 選択肢のリスト
		var sel_list = [];
		
		// 選択後の飛び先ラベルをまとめたリスト
		this.mSelectList = [];
		
		var sel_arg = ['s1','s2','s3','s4','s5','s6'];
		
		// 選択肢を入れる
		for(var i=0, length=sel_arg.length; i<length; i++){
			var arg = sel_arg[i];
			if( argument[arg]){
				var sel_data = argument[arg].split('/');
				var mes_text = sel_data[0];
				var result = TS_Function.evalText(mes_text);
				if(!result[1]) continue;
				mes_text = result[0].replace(/　/g," ");
				mes_text = result[0].replace(/_/g," ");
				sel_list.push(mes_text);
				this.mSelectList.push(sel_data[1]);
			}
		}
		
		// 選択肢は最低一ついる
		if( sel_list.length == 0 ) return;
		
		// 選択肢ウィンドウ作成
		$gameMessage.setChoices( sel_list, Number(argument['default']), Number(argument['cancel']) );
		$gameMessage.setChoiceBackground( Number(argument['back']) );
		$gameMessage.setChoicePositionType( Number(argument['pos']) );
		$gameMessage.setChoiceCallback(function(n) {
			this.jumpLabel(this.mSelectList[n]);
		}.bind(this));
		
		// ウェイトを入れる
		this.mWaitMode = 'message';
		
	}else if( macro.indexOf('@if ') != -1 ){
		//======================================
		// 条件分岐
		// eval   ：判定式 例)s(1) == 2,v(2) == true
		// 「s:スイッチ」「v:変数」
		// ok  ：成功時の処理 例）calc:set_s(1,false),set_v(1,v(1)+1), jump:*true_end
		// bad ：失敗時の処理 書き方は成功時と同じ
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['eval'] == null ) return;
		if( argument['ok'] == null && argument['bad'] == null ) return;
		
		// 処理部分を変更
		argument['eval'] = argument['eval'].replace('s(','$gameSwitches.value(');
		argument['eval'] = argument['eval'].replace('v(','$gameVariables.value(');
		
		
		// 判定を行う
		var result = null;
		if( eval(argument['eval']) ){
			result = argument['ok'];
		}else{
			result = argument['bad'];
		}
		
		// 処理が指定されていたら行う
		if( result ){
			var r_data = result.split(':');
			if( r_data[0] == 'calc' ){
				// 計算処理
				
				r_data[1] = r_data[1].replace('set_s(','$gameSwitches.setValue(');
				r_data[1] = r_data[1].replace('set_v(','$gameVariables.setValue(');
				r_data[1] = r_data[1].replace('s(','$gameSwitches.value(');
				r_data[1] = r_data[1].replace('v(','$gameVariables.value(');
				eval(r_data[1]);
			}else if( r_data[0] == 'jump' ){
				// 移動処理
				this.jumpLabel(r_data[1]);
			}
		}
	}else if( macro.indexOf('@wait ') != -1 ){
		//======================================
		// ウェイト
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		// ウェイトを入れる
		this.wait(argument['t']);
	}else if( macro.indexOf('@fade ') != -1 ){
		//======================================
		// フェード（イン・アウト両方対応）
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:1000});
		
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		if( argument['type'] == 'in' ){
			$gameScreen.startFadeIn(argument['t']);
		}else if( argument['type'] == 'out' ){
			$gameScreen.startFadeOut(argument['t']);
		}
		
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@fadeout_c') != -1 ){
		//======================================
		// フェードアウト
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:250,c:'w'});
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		switch(argument['c']){
			case 'w':
				argument['c'] = [255, 255, 255, 0];
				break;
		}
		
		$gameScreen.startTint(argument['c'], argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@fadein_c') != -1 ){
		//======================================
		// フェードイン
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:250});
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		argument['c'] = [0, 0, 0, 0];
		$gameScreen.startTint(argument['c'], argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@fade_c') != -1 ){
		//======================================
		// 色調変化
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:250,r:0,g:0,b:0,gr:0});
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		argument['c'] = [argument['r'], argument['g'], argument['b'], argument['gr']];
		
		$gameScreen.startTint(argument['c'], argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@fadein') != -1 ){
		//======================================
		// フェードイン
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:1000});
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		$gameScreen.startFadeIn(argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@fadeout') != -1 ){
		//======================================
		// フェードイン
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,t:1000});
		// 数値に戻す（型変換）
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		$gameScreen.startFadeOut(argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@qk') != -1 ){
		//======================================
		// クエイク
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{p:5,s:5,wt:1,t:150});
		
		// 数値に戻す（型変換）
		argument['p'] = Number(argument['p']);
		argument['s'] = Number(argument['s']);
		argument['t'] = Number(argument['t']);
		argument['wt'] = Number(argument['wt']);
		// 時間変更（ミリ秒⇒フレーム数）
		argument['t'] = this.secToFrame(argument['t']);
		
		$gameScreen.startShake(argument['p'], argument['s'], argument['t']);
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.wait(argument['t']);
		}
	}else if( macro.indexOf('@map_scroll ') != -1 ){
		//======================================
		// マップスクロール
		// 「2:下」「4:左」「6:右」「8:上」
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{wt:1,spd:4});
		
		// 指定は必ず必要
		if( argument['dir'] == null ) return;
		if( argument['dis'] == null ) return;
		
		// 方向指定は文字で来てるかも
		switch( argument['dir'] ){
			case 'down':
			case 'd':
				argument['dir'] = 2;
				break;
			case 'left':
			case 'l':
				argument['dir'] = 4;
				break;
			case 'right':
			case 'r':
				argument['dir'] = 6;
				break;
			case 'up':
			case 'u':
				argument['dir'] = 8;
				break;
		}
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['dir'] = Number(argument['dir']);
		argument['dis'] = Number(argument['dis']);
		argument['spd'] = Number(argument['spd']);
		// スクロール開始
		$gameMap.startScroll( argument['dir'], argument['dis'], argument['spd'] );
		// ウェイトを入れる
		if( argument['wt'] == 1 ){
			this.mWaitMode = 'scroll';
		}
	}else if( macro.indexOf('@gold ') != -1 ){
		//======================================
		// 所持金増減
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['val'] == null ) return;
		
		var val   = Number(argument['val']);
		
		// 所持金変更
		$gameParty.gainGold(val);
		
	}else if( macro.indexOf('@jump ') != -1 ){
		//======================================
		// ジャンプ命令
		// storage:ファイルを指定
		// target:ラベルを指定
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['storage'] == null && argument['target'] == null ) return;
		
		if( argument['storage'] ){
			// シナリオを読み込む
			this.start( argument['storage'], false );
		}
		
		if( argument['target'] ){
			// ラベルに飛ばす
			this.jumpLabel( argument['target'] );
		}
		
	}else if( macro.indexOf('@mes_win ') != -1 ){
		//======================================
		// メッセージウィンドウ変更
		// back:「0：ウィンドウ」「1：暗くする」「2：透明」
		// pos :「0：上」「1：中」「2：下」
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 背景
		if( argument['back'] != null ){
			this.mWindowBack = Number(argument['back']);
		}
		// 位置
		if( argument['pos'] != null ){
			this.mWindowPos = Number(argument['pos']);
		}
		
		
	}else if( macro == '@mes_win'){
		//======================================
		// メッセージウィンドウ設定リセット
		//======================================
		
		// 設定リセット
		this.resetMesOption();
	}else if( macro.indexOf('@map_title ') != -1 ){
		//======================================
		// マップ名表示の変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		
		if( argument['type'] == 'on' ){
			// マップ名表示：可
			$gameMap.enableNameDisplay();
		}else if( argument['type'] == 'off' ){
			// マップ名表示：不可
			$gameMap.disableNameDisplay();
		}
	}else if( macro.indexOf('@switches ') != -1 ){
		//======================================
		// スイッチの変更
		// id ：開始と終了を指定、開始しかない場合は一つだけ変更「1-2」
		// val：0 or 1を指定
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['id'] == null ) return;
		if( argument['val'] == null ) return;
		
		// IDを開始・終了に分ける
		var id = argument['id'].split('-');
		if( id[1] == null ) id[1] = id[0];
		
		// 必要な値
		var start = Number(id[0]);
		var end   = Number(id[1]);
		var val   = Number(argument['val']);
		
		// スイッチ変更
		for(var i = start; i <= end; i++){
			$gameSwitches.setValue(i, val === 1);
		}
	}else if( macro.indexOf('@variables ') != -1 ){
		//======================================
		// 変数の変更
		// id   ：開始と終了を指定、開始しかない場合は一つだけ変更　例「1-2」
		// val  ：使用する変数又は、変数IDを指定
		// calc ：「0：代入」「1：加算」「2：減算」「3：乗算」「4：除算」「5：剰余」
		// type ：「0：定数」「1：変数」「2：乱数」それ以外は保留
		// rand : 乱数の場合範囲を指定　例「1-5」
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{ calc:0, type:0 });
		
		// 指定は必ず必要
		if( argument['id'] == null ) return;
		if( argument['val'] == null && argument['rand'] == null ) return;
		
		// IDを開始・終了に分ける
		var id = argument['id'].split('-');
		if( id[1] == null ) id[1] = id[0];
		
		// 必要な値
		var start = Number(id[0]);
		var end   = Number(id[1]);
		var val   = Number(argument['val']);
		var calc  = Number(argument['calc']);
		var type  = Number(argument['type']);
		
		// 影響する値を調整
		switch(type){
			case 0:
				// 定数
				break;
			case 1:
				// 変数
				val = $gameVariables.value(val);
				break;
			case 2:
				// 乱数
				var rand = argument['rand'].split('-');
				rand[0] = Number(rand[0]);
				rand[1] = Number(rand[1]);
				val = rand[0] + Math.randomInt(rand[1] - rand[0] + 1);
				break;
		}
		
		// 変数変更
		for(var i = start; i <= end; i++){
			var v_id = i;
			var old_val = $gameVariables.value( v_id );
			try {
				switch (calc) {
					case 0:
						// 代入
						$gameVariables.setValue(v_id, old_val = val);
						break;
					case 1:
						// 加算
						$gameVariables.setValue(v_id, old_val + val);
						break;
					case 2:
						// 減算
						$gameVariables.setValue(v_id, old_val - val);
						break;
					case 3:
						// 乗算
						$gameVariables.setValue(v_id, old_val * val);
						break;
					case 4:
						// 除算
						$gameVariables.setValue(v_id, old_val / val);
						break;
					case 5:
						// 剰余
						$gameVariables.setValue(v_id, old_val % val);
						break;
				}
			} catch (e) {
				$gameVariables.setValue(v_id, 0);
			}
		}
	}else if( macro.indexOf('@common ') != -1 ){
		//======================================
		// コモンイベント 【使用不可】
		// id ：イベントID指定
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{});
		
		// 指定は必ず必要
		if( argument['id'] == null ) return;
		
		argument['id'] = Number(argument['id']);
		
		$gameTemp.reserveCommonEvent(argument['id']);
		
	}else if( macro.indexOf('@end') != -1 ){
		//======================================
		// 終了命令
		//======================================
		
		// スタックを全部消す
		this.resetStack();
	}
	
	//************************************************************
	// ドット演出系
	//************************************************************
	
	else if( macro.indexOf('@huki ') != -1 ){
		//======================================
		// ドット絵：吹き出し表示
		//  1:びっくり
		//  2:はてな
		//  3:音符
		//  4:ハート
		//  5:怒り
		//  6:汗
		//  7:くしゃくしゃ
		//  8:沈黙
		//  9:電球
		// 10:Zzz
		// 11:ユーザー定義1
		// 12:ユーザー定義2
		// 13:ユーザー定義3
		// 14:ユーザー定義4
		// 15:ユーザー定義5
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:0});
		
		// 指定は必ず必要
		if( argument['b'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['b'] = Number(argument['b']);
		
		// 吹き出しを出すキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		
		// 吹き出し表示
		this.mWaitData.requestBalloon(argument['b']);
		
		// ウェイトを入れる
		if( argument['wt'] ){
			this.mWaitMode = 'balloon';
		}
	}else if( macro.indexOf('@route ') != -1 ){
		//======================================
		// ドット絵：移動ルート設定
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1, repeat:0});
		
		// ルート指定は必ず必要
		if( argument['route'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['spd'] = Number(argument['spd']);
		argument['repeat'] = Number(argument['repeat']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = argument['repeat'] ? true : false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 移動速度変更処理
		if( argument['spd'] ) route.list.push( this.makeRoute(29,[argument['spd']]) );
		
		var route_list = argument['route'].split(',');
		for(var i=0, length=route_list.length; i<length; i++){
			var r_data = route_list[i].split(':');
			// 繰り返し回数が設定されていない場合
			if( r_data[1] == null ) r_data[1] = 1;
			else r_data[1] = Number(r_data[1]);
			
			// 移動方向
			var dir = 0;
			switch( r_data[0] ){
				case 'down':
				case 'd':
					dir = 1;
					break;
				case 'left':
				case 'l':
					dir = 2;
					break;
				case 'right':
				case 'r':
					dir = 3;
					break;
				case 'up':
				case 'u':
					dir = 4;
					break;
			}
			// 回数分ループさせる
			for(var cnt=0; cnt<r_data[1]; cnt++){
				route.list.push( this.makeRoute(dir) );
			}
		}
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
		
		
	}else if( macro.indexOf('@route_point ') != -1 ){
		//======================================
		// ドット絵：移動ルート設定
		// 指定場所まで移動
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// ルート指定は必ず必要
		if( argument['x'] == null || argument['y'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['wt'] = Number(argument['wt']);
		argument['spd'] = Number(argument['spd']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 移動速度変更処理
		if( argument['spd'] ) route.list.push( this.makeRoute(29,[argument['spd']]) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		
		var move_x = argument['x'] - this.mWaitData.x;
		var move_y = argument['y'] - this.mWaitData.y;
		var route_list = [];
		if(move_x > 0){
			route_list.push( 'r:' + move_x );
		}else if(move_x < 0){
			route_list.push( 'l:' + (move_x*-1) );
		}
		
		if(move_y > 0){
			route_list.push( 'd:' + move_y );
		}else if(move_y < 0){
			route_list.push( 'u:' + (move_y*-1) );
		}
		
		console.log(move_x);
		console.log(move_y);
		
		for(var i=0, length=route_list.length; i<length; i++){
			var r_data = route_list[i].split(':');
			// 繰り返し回数が設定されていない場合
			if( r_data[1] == null ) r_data[1] = 1;
			else r_data[1] = Number(r_data[1]);
			
			// 移動方向
			var dir = 0;
			switch( r_data[0] ){
				case 'down':
				case 'd':
					dir = 1;
					break;
				case 'left':
				case 'l':
					dir = 2;
					break;
				case 'right':
				case 'r':
					dir = 3;
					break;
				case 'up':
				case 'u':
					dir = 4;
					break;
			}
			// 回数分ループさせる
			for(var cnt=0; cnt<r_data[1]; cnt++){
				route.list.push( this.makeRoute(dir) );
			}
		}
		
		if( argument['dir'] ){
			// 移動方向
			var dir = 0;
			switch( argument['dir'] ){
				case 'down':
				case 'd':
					dir = 16;
					break;
				case 'left':
				case 'l':
					dir = 17;
					break;
				case 'right':
				case 'r':
					dir = 18;
					break;
				case 'up':
				case 'u':
					dir = 19;
					break;
			}
			// ルート追加
			route.list.push( this.makeRoute(dir) );
		}
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
		
		
	}else if( macro.indexOf('@fb ') != -1 ){
		//======================================
		// ドット絵：前進or後退
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, dir:'for', num:1, wt:1});
		
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['num'] = Number(argument['num']);
		argument['spd'] = Number(argument['spd']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 移動速度変更処理
		if( argument['spd'] ) route.list.push( this.makeRoute(29,[argument['spd']]) );
		
		// 移動方向
		var dir = 0;
		switch( argument['dir'] ){
			case 'for':
				dir = 12;
				break;
			case 'back':
				dir = 13;
				break;
		}
		
		// 指定回数分動かす
		for(var i=0; i<argument['num']; i++){
			route.list.push( this.makeRoute(dir) );
		}
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
		
		
	}else if( macro.indexOf('@c_jump') != -1 ){
		//======================================
		// ドット絵：ジャンプ
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, x:0, y:0, wt:1});
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// ジャンプ方向を決める（現在地点から）
		// 指定がない場合はその場でジャンプ
		route.list.push( this.makeRoute(14,[ argument['x'], argument['y'] ]) );
		// 終了コード
		route.list.push( this.makeRoute(0) );
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@dir ') != -1 ){
		//======================================
		// ドット絵：向き変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// 向き指定は必ず必要
		if( argument['dir'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 移動方向
		var dir = 0;
		switch( argument['dir'] ){
			case 'down':
			case 'd':
				dir = 16;
				break;
			case 'left':
			case 'l':
				dir = 17;
				break;
			case 'right':
			case 'r':
				dir = 18;
				break;
			case 'up':
			case 'u':
				dir = 19;
				break;
			case 'turn_r':
				// 右に90度回転
				dir = 20;
				break;
			case 'turn_l':
				// 左に90度回転
				dir = 21;
				break;
			case 'turn':
				// 180度回転
				dir = 22;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(dir) );
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
		
		
	}else if( macro.indexOf('@move_speed') != -1 ){
		//======================================
		// ドット絵：移動速度変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, spd:4});
		
		// 数値に戻す（型変換）
		argument['spd'] = Number(argument['spd']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = false,
		//完了までウェイト（true か false）
		route.wait = true;
		route.list = [];
		
		// 移動速度変更処理
		route.list.push( this.makeRoute(29,[argument['spd']] ) );
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
		
	}else if( macro.indexOf('@walk_anime ') != -1 ){
		//======================================
		// ドット絵：歩行アニメフラグ変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:0});
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		// パラメータのID
		var param_id = 0;
		switch( argument['type'] ){
			case 'on':
				// アニメ再生
				param_id = 31;
				break;
			case 'off':
				// アニメ停止
				param_id = 32;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(param_id) );
		// 終了コード
		route.list.push( this.makeRoute(0) );
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@step_anime ') != -1 ){
		//======================================
		// ドット絵：足踏みアニメフラグ変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:0});
		
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// パラメータのID
		var param_id = 0;
		switch( argument['type'] ){
			case 'on':
				// アニメ再生
				param_id = 33;
				break;
			case 'off':
				// アニメ停止
				param_id = 34;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(param_id) );
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@dir_fix ') != -1 ){
		//======================================
		// ドット絵：向き固定フラグ変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// パラメータのID
		var param_id = 0;
		switch( argument['type'] ){
			case 'on':
				// 固定
				param_id = 35;
				break;
			case 'off':
				// 非固定
				param_id = 36;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(param_id) );
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@through ') != -1 ){
		//======================================
		// ドット絵：すり抜けフラグ変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// パラメータのID
		var param_id = 0;
		switch( argument['type'] ){
			case 'on':
				// すり抜け可
				param_id = 37;
				break;
			case 'off':
				// すり抜け不可
				param_id = 38;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(param_id) );
		
		// 終了コード
		route.list.push( this.makeRoute(0) );
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@invisible ') != -1 ){
		//======================================
		// ドット絵：透明化フラグ変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		// 指定は必ず必要
		if( argument['type'] == null ) return;
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = true,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		// パラメータのID
		var param_id = 0;
		switch( argument['type'] ){
			case 'on':
				// 透明にする
				param_id = 39;
				break;
			case 'off':
				// 透明にしない
				param_id = 40;
				break;
		}
		// ルート追加
		route.list.push( this.makeRoute(param_id) );
		// 終了コード
		route.list.push( this.makeRoute(0) );
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@change ') != -1 ){
		//======================================
		// ドット絵：画像変更
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		
		// 指定は必ず必要
		if( argument['f'] == null )   argument['f']   = this.mWaitData._characterName;
		if( argument['num'] == null ) argument['num'] = this.mWaitData._characterIndex;
		
		// 特殊なファイル名指定の場合
		if( argument['f'].indexOf('_nowBody') != -1 ){
			var name = argument['f'].split('_')[0];
			argument['f'] = name + '_' + this.getBodyCos(name,true,true);
		}
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['num'] = Number(argument['num']);
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = false,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 画像名と使用する番号（0～7）を指定
		route.list.push( this.makeRoute(41,[ argument['f'], argument['num'] ]) );
		// 終了コード
		route.list.push( this.makeRoute(0) );
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@change') != -1 ){
		//======================================
		// ドット絵：画像変更（デフォルトに戻す）
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// ルートデータを入れるキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		
		// 指定は必ず必要
		if( argument['f'] == null ) argument['f']   = this.mWaitData._characterName;
		
		argument['num'] = 0;
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['num'] = Number(argument['num']);
		// ルートデータ作成
		var route = {};
		//動作を繰り返す（true か false）
		route.repeat = false,
		//移動できない場合は飛ばす（true か false）
		route.skippable = false,
		//完了までウェイト（true か false）
		route.wait = Boolean(argument['wt']);
		route.list = [];
		
		// 画像名と使用する番号（0～7）を指定
		route.list.push( this.makeRoute(41,[ argument['f'], argument['num'] ]) );
		// 終了コード
		route.list.push( this.makeRoute(0) );
		// ルート設定
		this.mWaitData.forceMoveRoute(route);
		// ウェイトを入れる
		if( route.wait ){
			this.mWaitMode = 'route';
		}
	}else if( macro.indexOf('@actor_img') != -1 ){
		//======================================
		// ドット絵：画像変更（デフォルトに戻す）
		//======================================
		// c_img ：ドット絵のファイル名
		// c_num ：ドット絵の番号
		// f_img ：顔画像のファイル名
		// f_num ：顔画像の番号
		// b_img ：戦闘画像のファイル名
		
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:1,c_img:'',f_img:'',b_img:'',c_num:0,f_num:0});
		
		var actor = $gameActors.actor(argument['id']);
		if(actor){
			if( argument['c_img'] == '' ){
				argument['c_img']   = this.getBody(actor._name);
			}
			if( argument['f_img'] == '' ){
				argument['f_img']   = this.getBody(actor._name);
			}

			actor.setCharacterImage(argument['c_img'], argument['c_num']);
			actor.setFaceImage(argument['f_img'], argument['f_num']);
			actor.setBattlerImage(argument['b_img']);
		}
		$gamePlayer.refresh();
	}else if( macro.indexOf('@anime ') != -1 ){
		//======================================
		// ドット絵：アニメーション再生
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, wt:1});
		
		// 指定は必ず必要
		if( argument['num'] == null ) return;
		
		// 数値に戻す（型変換）
		argument['wt'] = Number(argument['wt']);
		argument['num'] = Number(argument['num']);
		
		// アニメーションを再生するキャラを決める
		this.mWaitData = this.getCharacter(argument['id']);
		// アニメ再生
		this.mWaitData.requestAnimation(argument['num']);
		// ウェイトを入れる
		if( argument['wt'] ){
			this.mWaitMode = 'animation';
		}
	}else if( macro.indexOf('@dot_move ') != -1 ){
		//======================================
		// ドット絵：場所移動
		// map:マップIDを指定しない場合は今いるマップ
		// dir:向きを指定しない場合はそのまま
		// ※「0：そのまま」「2:下」「4:左」「6:右」「8:上」
		// fade:フェード方法を指定しない場合はフェード無し
		// ※「0：黒」「1:白」「2:無し」
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{id:-1, dir:0, fade:2});
		
		// 座標指定は必ず必要
		if( argument['x'] == null ) argument['x'] = $gamePlayer.x;
		if( argument['y'] == null ) argument['y'] = $gamePlayer.y;
		
		// IDの調整
		if( argument['id'] == 'p' ) argument['id'] = -1;
		
		// マップ座標の指定がない場合は現在のマップ
		if( argument['map'] == null ) argument['map'] = $gameMap._mapId;
		
		// 方向指定は文字で来てるかも
		switch( argument['dir'] ){
			case 'down':
			case 'd':
				argument['dir'] = 2;
				break;
			case 'left':
			case 'l':
				argument['dir'] = 4;
				break;
			case 'right':
			case 'r':
				argument['dir'] = 6;
				break;
			case 'up':
			case 'u':
				argument['dir'] = 8;
				break;
		}
		
		// 数値に戻す（型変換）
		argument['id'] = Number(argument['id']);
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['map'] = Number(argument['map']);
		argument['dir'] = Number(argument['dir']);
		argument['fade'] = Number(argument['fade']);
		
		if( argument['id'] < 0 ){
			// プレイヤー
			$gamePlayer.reserveTransfer(argument['map'], argument['x'], argument['y'], argument['dir'], argument['fade']);
		}else{
			// イベント
			
			// 移動させるイベント取得
			var character = this.getCharacter(argument['id']);
			character.locate( argument['x'], argument['y'] );
			if( argument['dir'] > 0 ){
				character.setDirection( argument['dir'] );
			}
		}
		
		// ウェイトを入れる
		this.mWaitMode = 'transfer';
	}else if( macro.indexOf('@event_warp ') != -1 ){
		//======================================
		// ドット絵：場所移動
		// id:移動させるイベントID（必須）
		// x:移動後の座標
		// y:移動後の座標
		// dir:向きを指定しない場合はそのまま
		// ※「0：そのまま」「2:下」「4:左」「6:右」「8:上」
		//======================================
		// 引数をまとめたリスト作成
		argument = this.makeArg(macro,{ dir:0 });
		
		// 座標指定は必ず必要
		if( argument['id'] == null ) return;
		if( argument['x'] == null ) return;
		if( argument['y'] == null ) return;
		
		
		// 方向指定は文字で来てるかも
		switch( argument['dir'] ){
			case 'down':
			case 'd':
				argument['dir'] = 2;
				break;
			case 'left':
			case 'l':
				argument['dir'] = 4;
				break;
			case 'right':
			case 'r':
				argument['dir'] = 6;
				break;
			case 'up':
			case 'u':
				argument['dir'] = 8;
				break;
		}
		
		// 数値に戻す（型変換）
		argument['id'] = Number(argument['id']);
		argument['x'] = Number(argument['x']);
		argument['y'] = Number(argument['y']);
		argument['dir'] = Number(argument['dir']);
		
		// 移動させるイベントを決める
		this.mWaitData = this.getCharacter(argument['id']);
		
		
		// 移動させるイベント取得
		var character = this.getCharacter(argument['id']);
		character.locate( argument['x'], argument['y'] );
		if( argument['dir'] > 0 ){
			character.setDirection( argument['dir'] );
		}
		
	}else if( macro.indexOf('@pl ') != -1 ){
		//======================================
		// 画像事前読み込み
		//======================================
		
		// デフォルト値も指定
		argument = this.makeArg(macro,{});
		
		// ファイル名は必須
		if( argument['f'] == null ){
			return;
		}
		// 処女指定
		if( argument['v'] ){
			if( $gameSwitches.value(TS_GameConfig.argRpModeSwi) ){
				// 回想時
				if( $gameSwitches.value(TS_GameConfig.argRpVirginSwi) ){
					argument['f'] += '_v';
				}
			}else{
				// 通常時
				if( !$gameSwitches.value(TS_GameConfig.argVirginSwi) ){
					argument['f'] += '_v';
				}
			}
		}
		
		// 再生するCGを髪色によって変える
		if( argument['f'].indexOf('ev') !=-1 ){
			var actor = TS_Function.getActor(TS_GameConfig.HeroineName);
			if(actor){
				var hair_name = actor.getHairName();
				if(hair_name != ''){
					argument['f'] += hair_name;
				}
			}
		}
		
		// 読み込み数カウント
		this.mPlCnt++;
		
		// 透明状態で読み込み
		var opacity = 0;
		$gameScreen.showPicture(this.mPlCnt, argument['f'], 0, 0, 0, 100, 100, opacity, 0);
		
	}else if( macro.indexOf('@pl_end') != -1 ){
		//======================================
		// 画像事前読み込み終了
		//======================================
		for(var i=1; i<=this.mPlCnt; i++){
			$gameScreen.erasePicture(i);
		}
		
		this.mPlCnt = 0;
		
		
	}else if( macro.indexOf('@script ') != -1 ){
		//======================================
		// スクリプト呼び出し
		//======================================
		
		argument = this.makeArg(macro,{});
		// 指定は必要
		if( argument['name'] == null ){
			return;
		}
		eval(argument['name']);
		
	}else if( macro.indexOf('@plugin ') != -1 ){
		//======================================
		// スクリプト呼び出し
		//======================================
		argument = this.makeArg(macro,{});
		// 指定は必要
		if( argument['name'] == null ){
			return;
		}
		
		var plugin = argument['name'].split(' ');
		var args = plugin.split(" ");
		var command = args.shift();
		
		$gameMap._interpreter.pluginCommand(command,args);
		
	}
	
	
	// マクロ指定ここまで
	
}

// 文章調整のセット
ADV_System.prototype.setAjasuto = function(flag) {
	this.mTextAjasuto = flag;
}

// 文章調整の取得
ADV_System.prototype.getAjasuto = function() {
	return this.mTextAjasuto;
}

//*****************************************************************************************************
// ここから既存の関数変更
//*****************************************************************************************************

// メッセージウィンドウのパディング調整
/*
Window_Message.prototype.newLineX = function() {
	return 84;
};
*/

// ○データに登録
var _TS_adv_DataManager_createGameObjects = DataManager.createGameObjects;
DataManager.createGameObjects = function() {
	_TS_adv_DataManager_createGameObjects.call(this);
	$advSystem = new ADV_System();
};



var _TS_adv_DataManager_makeSaveContents = DataManager.makeSaveContents;
DataManager.makeSaveContents = function() {
	var contents = _TS_adv_DataManager_makeSaveContents.apply(this, arguments);
	contents.advSys = $advSystem;
	return contents;
};

var _TS_adv_DataManager_extractSaveContents = DataManager.extractSaveContents;
DataManager.extractSaveContents = function(contents) {
	_TS_adv_DataManager_extractSaveContents.apply(this, arguments);
	$advSystem = contents.advSys;
	// ロード時に現在のテキストをスタック
	if($advSystem === undefined) $advSystem = new ADV_System();
	if($advSystem.isRun()){
		$advSystem.messageSave();
	}
};



// ○メッセージ終了時に次の処理を読みこませる
var _TS_adv_Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
Window_Message.prototype.terminateMessage = function() {
	_TS_adv_Window_Message_terminateMessage.call(this);
	// スタックを走らせる
	//$advSystem.stackRun();
	//$advSystem.nextStack();
};

// ○各シーンでのループ
var _TS_adv_Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
	$advSystem.update();
	_TS_adv_Scene_Map_update.call(this);
};

var _TS_adv_Scene_Battle_update = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() {
	$advSystem.update();
	_TS_adv_Scene_Battle_update.call(this);
	
};

// 戦闘中の待機処理
var _TS_adv_BattleManager_isBusy = BattleManager.isBusy;
BattleManager.isBusy = function() {
	return _TS_adv_BattleManager_isBusy.call(this) || $advSystem.isRun();
};

/*
Game_Map.prototype.update = function(sceneActive) {
	_TS_adv_Game_Map_update.call(this,sceneActive);
	$advSystem.update();
};
*/

var _TS_adv_Game_Interpreter_initialize = Game_Interpreter.prototype.initialize;
Game_Interpreter.prototype.initialize = function(depth) {
	_TS_adv_Game_Interpreter_initialize.call(this,depth);
	this._mAdvRun = false;
};

// ●書き換え
Game_Interpreter.prototype.updateWait = function() {
	//return this.updateWaitCount() || this.updateWaitMode();
	return this.updateWaitCount() || this.updateWaitMode() || this._mAdvRun;
};

// △新規
Game_Interpreter.prototype.setAdvRun = function(flag) {
	this._mAdvRun = flag;
	if (this._childInterpreter) this._childInterpreter.setAdvRun(flag);
};


// ●書き換え
// Show Text
Game_Interpreter.prototype.command101 = function() {
	if (!$gameMessage.isBusy()) {
		$gameMessage.setFaceImage(this._params[0], this._params[1]);
		$gameMessage.setBackground(this._params[2]);
		$gameMessage.setPositionType(this._params[3]);
		while (this.nextEventCode() === 401) {  // Text data
			this._index++;
			// テキストの表示調整を追加
			//$gameMessage.add(this.currentCommand().parameters[0]);
			$gameMessage.add( $advSystem.viewMesAdjust(this.currentCommand().parameters[0]) );
		}
		switch (this.nextEventCode()) {
		case 102:  // Show Choices
			this._index++;
			this.setupChoices(this.currentCommand().parameters);
			break;
		case 103:  // Input Number
			this._index++;
			this.setupNumInput(this.currentCommand().parameters);
			break;
		case 104:  // Select Item
			this._index++;
			this.setupItemChoice(this.currentCommand().parameters);
			break;
		}
		this._index++;
		this.setWaitMode('message');
	}
	return false;
};






// 音声関係

AudioManager.playVoice = function(voice) {
	if (voice.name) {
		// 音声再生準備段階のファイルはプレイ中扱いにならず
		// 同時に呼び出したSEファイルが消えるのでボイスファイルだけチェック
		this._seBuffers = this._seBuffers.filter(function(audio) {
			if( audio._url.indexOf('/voice/') != -1 ){
				return audio.isPlaying();
			}
			return true;
		});
		var buffer = this.createBuffer('voice', voice.name);
		this.updateVoiceParameters(buffer, voice);
		buffer.play(false);
		this._seBuffers.push(buffer);
	}
};

AudioManager.stopVoice = function() {
	this._seBuffers.forEach(function(buffer) {
		if( buffer._url.indexOf('/voice/') != -1 ){
			buffer.stop();
		}
	});
	
};

AudioManager.updateVoiceParameters = function(buffer, voice) {
	this.updateBufferParameters(buffer, this._seVolume*2.5, voice);
};

AudioManager.playBgv = function(bgv, pos) {
	if (this.isCurrentBgs(bgv)) {
		this.updateBgvParameters(bgv);
	} else {
		this.stopBgs();
		if (bgv.name) {
			this._bgsBuffer = this.createBuffer('bgs', bgv.name);
			this.updateBgvParameters(bgv);
			this._bgsBuffer.play(true, pos || 0);
		}
	}
	this.updateCurrentBgs(bgv, pos);
};

AudioManager.updateBgvParameters = function(bgs) {
	this.updateBufferParameters(this._bgsBuffer, this._seVolume*1.5, bgs);
};

// 書き換え
AudioManager.playSe = function(se) {
	if (se.name) {
		this._seBuffers = this._seBuffers.filter(function(audio) {
			return audio.isPlaying() || (audio._loadListeners.length > 0);
		});
		var buffer = this.createBuffer('se', se.name);
		this.updateSeParameters(buffer, se);
		buffer.play(false);
		this._seBuffers.push(buffer);
	}
};

// ○プラグインコマンド拡張
var _TS_adv_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
	_TS_adv_Game_Interpreter_pluginCommand.call(this, command, args);
	if (command === 'AdvLoad') {
		$saveEx.save('pluginSkip',false);
		if( args[0] == 'macro' ){
			// マクロを直接指定
			var macro = args.concat();
			macro.shift();
			macro = macro.join(' ');
			$advSystem.macroRun(macro);
		}else{
			
			$advSystem.start(TS_Function.convertEscape(args[0]));
		}
		
		
	}
	
	if (command === 'AdvSystem') {
		$saveEx.save('pluginSkip',false);
		if( args[0] == 'AJASUTO' ){
			$advSystem.setAjasuto(eval(args[1]));
		}
		
		
	}
};
