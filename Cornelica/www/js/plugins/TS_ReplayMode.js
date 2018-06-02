//=========================================================
// TS_ReplayMode
//=========================================================

/*:ja
 * @plugindesc
 * 回想モードを追加

 * @param RPtext
 * @desc RPシーン情報のテキストファイル
 * @default rplist
 
 * @param CGtext
 * @desc CGシーン情報のテキストファイル
 * @default cglist
 
 * @param Replay Mode Name
 * @desc メニューに表示するテキスト
 * @default 回想
 
 * @param RP Name
 * @desc 回想ウィンドウに表示する名前
 * @default 回想
 
 * @param CG Name
 * @desc 回想ウィンドウに表示する名前
 * @default CGモード
 
 * @param Common Event
 * @desc 回想再生時に呼び出すコモンイベント
 * @default 1
 
 * @param Common View
 * @desc 回想をメニューコマンドに含めるか（ON/OFF）
 * @default ON
*/

function Scene_Replay() {
	this.initialize.apply(this, arguments);
}

function Window_ReplayBase() {
	this.initialize.apply(this, arguments);
}

function Window_ReplayCommand() {
	this.initialize.apply(this, arguments);
}

(function() {
	
	// 引数
	var parameters = PluginManager.parameters('TS_ReplayMode');
	var argRPtext = String(parameters['RPtext'] || 'rplist');
	var argCGtext = String(parameters['CGtext'] || 'cglist');
	var argReplayMode = String(parameters['Replay Mode Name'] || '回想');
	var argRpName = String(parameters['RP Name'] || '回想');
	var argCgName = String(parameters['CG Name'] || 'CGモード');
	var argCommonEvent = parseInt(parameters['Common Event'] || 1);
	var argMenuView = parseInt(parameters['Common View'] || 'ON');
	
	var argViewCol = 5;
	var argThumWidth = 160;
	var argThumHeight = 120;
	
	//****************************************************************************
	// メニュー拡張
	//****************************************************************************
	
	//---------------------------------
	// ImageManagerの変更
	//---------------------------------
	
	ImageManager.loadThum = function(filename, hue) {
		return this.loadBitmap('img/thum/', filename, hue, true);
	};
	
	//---------------------------------
	// Window_MenuCommandの変更
	//---------------------------------
	
	// ○回想コマンド追加
	var _TS_ReplayMode_Window_MenuCommand_addOriginalCommands = Window_MenuCommand.prototype.addOriginalCommands;
	Window_MenuCommand.prototype.addOriginalCommands = function() {
		_TS_ReplayMode_Window_MenuCommand_addOriginalCommands.call(this);
		if(argMenuView == 'ON'){
			var enabled = this.isReplayModeEnabled();
			this.addCommand(argReplayMode, 'replay', enabled);
		}
	};
	
	// △回想コマンド選択可能か判定
	Window_MenuCommand.prototype.isReplayModeEnabled = function() {
		return true;
	};
	
	//---------------------------------
	// Scene_Menuの変更
	//---------------------------------
	
	// ○回想モードのハンドルを読み込む
	var _TS_ReplayMode_Scene_Menu_createCommandWindow = Scene_Menu.prototype.createCommandWindow;
	Scene_Menu.prototype.createCommandWindow = function() {
		_TS_ReplayMode_Scene_Menu_createCommandWindow.call(this);
		this._commandWindow.setHandler('replay', this.commandReplay.bind(this));
	};
	
	// △回想モードを選択した際の処理
	Scene_Menu.prototype.commandReplay = function() {
		SceneManager.push(Scene_Replay);
	};

	//-----------------------------------------------------------------------------
	// Scene_Replay
	/*
	function Scene_Replay() {
		this.initialize.apply(this, arguments);
	}
	*/

	Scene_Replay.prototype = Object.create(Scene_MenuBase.prototype);
	Scene_Replay.prototype.constructor = Scene_Replay;

	Scene_Replay.prototype.initialize = function() {
		Scene_MenuBase.prototype.initialize.call(this);
	};

	Scene_Replay.prototype.create = function() {
		Scene_MenuBase.prototype.create.call(this);
		this.createCommandWindow();
		this.createReplayWindow();
		this.viewWindow();
	};

	Scene_Replay.prototype.terminate = function() {
		Scene_MenuBase.prototype.terminate.call(this);
	};

	Scene_Replay.prototype.createCommandWindow = function() {
		this._commandWindow = new Window_ReplayCommand();
		this._commandWindow.setHandler('rp', this.commandPersonal.bind(this));
		this._commandWindow.setHandler('cg', this.commandPersonal.bind(this));
		this._commandWindow.setHandler('cancel', this.popScene.bind(this));
		this.addWindow(this._commandWindow);
	};
	
	Scene_Replay.prototype.commandPersonal = function() {
		this._selectWindow.selectLast();
		this._selectWindow.activate();
		this._selectWindow.setHandler('ok',     this.onPersonalOk.bind(this));
		this._selectWindow.setHandler('cancel', this.onPersonalCancel.bind(this));
	};
	
	Scene_Replay.prototype.createReplayWindow = function() {
		// 表示無し
		this._noneWindow = new Window_ReplayBase(0, this._commandWindow.height);
		this.addWindow(this._noneWindow);
		this._noneWindow.deselect();
		this._noneWindow.deactivate();
		
		// RP
		this._rpWindow = new Window_RP(0, this._commandWindow.height);
		this.addWindow(this._rpWindow);
		
		// RP選択用
		var win_w = 280;
		var win_x = Math.floor((Graphics.boxWidth - win_w) / 2);
		var win_y = 200;
		this._rpSelWindow = new Window_RPSel(argViewCol, win_x, win_y, win_w);
		this.addWindow(this._rpSelWindow);
		this._rpSelWindow.setHandler('ok',     this.onReplayStart.bind(this));
		this._rpSelWindow.setHandler('cancel', this.onReplayCancel.bind(this));
		this._rpSelWindow.hide();
		this._rpSelWindow.deactivate();
		
		// CG
		this._cgWindow = new Window_CG(0, this._commandWindow.height);
		this.addWindow(this._cgWindow);
		
		// CG画像再生用
		this._cgViewWindow = new Window_CGView();
		this.addWindow(this._cgViewWindow);
		this._cgViewWindow.setHandler('ok',     this.onPlayBackStart.bind(this));
		this._cgViewWindow.setHandler('cancel', this.onPlayBackCancel.bind(this));
		this._cgViewWindow.hide();
		this._cgViewWindow.deactivate();
		
	};
	
	// 選択中の項目に合わせてウィンドウ表示
	Scene_Replay.prototype.viewWindow = function() {
		var symbol = this._commandWindow.currentSymbol();
		
		// 一旦全部閉じる
		this._noneWindow.hide();
		this._rpWindow.hide();
		this._cgWindow.hide();
		
		switch(symbol){
			case 'rp':
				this._selectWindow = this._rpWindow;
				break;
			case 'cg':
				this._selectWindow = this._cgWindow;
				break;
			case 'cancel':
				this._selectWindow = this._noneWindow;
				break;
		}
		
		this._selectWindow.show();
		
		this._rpWindow.deselect();
		this._cgWindow.deselect();
		
		this._rpWindow.deactivate();
		this._cgWindow.deactivate();
		
		this._rpWindow.refresh();
		this._cgWindow.refresh();
		this._noneWindow.refresh();
		
		
	};
	
	Scene_Replay.prototype.onPersonalOk = function() {
		switch (this._commandWindow.currentSymbol()) {
			case 'rp':
				// 回想開始
				this._rpWindow.deactivate();
				this._rpSelWindow.activate();
				// ボタンのセット
				this._rpSelWindow.clearCommandList();
				var id = this._rpWindow.currentExt();
				this._rpSelWindow.setData( this._rpWindow.getOpenList(id) );
				this._rpSelWindow.show();
				this._rpSelWindow.refresh();
				break;
			case 'cg':
				// 回想開始
				
				this._cgWindow.deactivate();
				this._cgViewWindow.activate();
				// ボタンのセット
				var id = this._cgWindow.currentExt();
				this._cgViewWindow.set( this._cgWindow.openAllList(), id );
				this._cgViewWindow.show();
				this._cgViewWindow.playBackStart();
				break;
		}
	};
	
	Scene_Replay.prototype.onPersonalCancel = function() {
		switch (this._commandWindow.currentSymbol()) {
			case 'rp':
				this._selectWindow.deselect();
				this._commandWindow.activate();
				break;
			case 'cg':
				this._selectWindow.deselect();
				this._commandWindow.activate();
				break;
		}
		
		
		
	};
	
	// 回想開始
	Scene_Replay.prototype.onReplayStart = function() {
		$advSystem.mReplayMode = this._rpSelWindow.currentExt();
		SceneManager.goto(Scene_Map);
		$gameSwitches.setValue(TS_GameConfig.argRpSetSwi,true);
		$gameTemp.reserveCommonEvent(argCommonEvent);
	};
	
	// 回想終了
	Scene_Replay.prototype.onReplayCancel = function() {
		this._selectWindow.activate();
		this._rpSelWindow.deactivate();
		this._rpSelWindow.hide();
	};
	
	// ギャラリー進む
	Scene_Replay.prototype.onPlayBackStart = function() {
		this._cgViewWindow.playBackNext();
		this._cgViewWindow.activate();
	};
	
	// ギャラリー解除
	Scene_Replay.prototype.onPlayBackCancel = function() {
		this._cgViewWindow.playBackEnd();
		this._cgViewWindow.deactivate();
		this._cgViewWindow.hide();
		this._cgWindow.activate();
	};
	
	
	//-----------------------------------------------------------------------------
	// Window_FreeCommand
	// 横に並べていくコマンドウィンドウ
	
	function Window_FreeCommand() {
		this.initialize.apply(this, arguments);
	}

	Window_FreeCommand.prototype = Object.create(Window_Command.prototype);
	Window_FreeCommand.prototype.constructor = Window_FreeCommand;

	Window_FreeCommand.prototype.initialize = function(col, x, y, iw) {
		this._mMaxCol = col;
		this._mWindowWidth = iw || Graphics.boxWidth;
		Window_Command.prototype.initialize.call(this, x, y);
		this.selectLast();
	};

	Window_FreeCommand._lastCommandSymbol = null;

	Window_FreeCommand.initCommandPosition = function() {
		this._lastCommandSymbol = null;
	};
	
	Window_FreeCommand.prototype.windowWidth = function() {
		return this._mWindowWidth;
	};
	
	Window_FreeCommand.prototype.maxCols = function() {
		return this._mMaxCol;
	};
	
	Window_FreeCommand.prototype.selectLast = function() {
	};

	//-----------------------------------------------------------------------------
	// Window_ReplayCommand
	/*
	function Window_ReplayCommand() {
		this.initialize.apply(this, arguments);
	}*/

	Window_ReplayCommand.prototype = Object.create(Window_FreeCommand.prototype);
	Window_ReplayCommand.prototype.constructor = Window_ReplayCommand;

	Window_ReplayCommand.prototype.initialize = function() {
		Window_FreeCommand.prototype.initialize.call(this, argViewCol, 0, 0);
	};

	Window_ReplayCommand._lastCommandSymbol = null;

	Window_ReplayCommand.initCommandPosition = function() {
		this._lastCommandSymbol = null;
	};
	
	Window_ReplayCommand.prototype.makeCommandList = function() {
		this.addMainCommands();
	};

	Window_ReplayCommand.prototype.addMainCommands = function() {
		this.addCommand('戻る', 'cancel');
		this.addCommand(argRpName, 'rp');
		this.addCommand(argCgName, 'cg');
	};

	Window_ReplayCommand.prototype.processOk = function() {
		Window_ReplayCommand._lastCommandSymbol = this.currentSymbol();
		Window_Command.prototype.processOk.call(this);
	};

	Window_ReplayCommand.prototype.selectLast = function() {
		this.selectSymbol(Window_ReplayCommand._lastCommandSymbol);
	};
	
	Window_ReplayCommand.prototype.update = function() {
		var lastIndex = this.index();
		Window_FreeCommand.prototype.update.call(this);
		if (this.index() !== lastIndex) {
			SceneManager._scene.viewWindow();
		}
	};
	
	
	//-----------------------------------------------------------------------------
	// Window_ReplayBase
	/*
	function Window_ReplayBase() {
		this.initialize.apply(this, arguments);
	}
	*/

	Window_ReplayBase.prototype = Object.create(Window_FreeCommand.prototype);
	Window_ReplayBase.prototype.constructor = Window_ReplayBase;

	Window_ReplayBase.prototype.initialize = function(x, y) {
		this.fileLoad();
		this._mCompHeight = y;
		Window_FreeCommand.prototype.initialize.call(this, argViewCol, x, y);
		this.makeCommandList();
		this.refresh();
	};

	Window_ReplayBase.prototype.windowHeight = function() {
		return Graphics.boxHeight - this._mCompHeight;
	};
	
	Window_ReplayBase.prototype.makeCommandList = function() {
		this.addMainCommands();
	};

	Window_ReplayBase.prototype.addMainCommands = function() {
	};
	
	Window_ReplayBase.prototype.itemWidth = function() {
		return argThumWidth + 4;
	};
	
	Window_ReplayBase.prototype.itemHeight = function() {
		return argThumHeight + 4;
	};
	
	Window_ReplayBase.prototype.paddingWidth = function() {
		return Math.floor( (this.width - this.padding * 2 - ( (this.itemWidth() + this.spacing()) * this.maxCols() ) ) / 2 );
	};
	
	Window_ReplayBase.prototype.paddingHeight = function() {
		return 24;
	};
	
	Window_ReplayBase.prototype.drawItem = function(index) {
		//this.drawItemBackground(index);
		this.drawItemImage(index);
	};
	
	Window_ReplayBase.prototype.itemRect = function(index) {
		var rect = new Rectangle();
		var maxCols = this.maxCols();
		var col = index % maxCols;
		rect.width = this.itemWidth();
		rect.height = this.itemHeight();
		rect.x = this.paddingWidth() + col * (rect.width + this.spacing()) + this.spacing()/2 - this._scrollX;
		rect.y = this.paddingHeight() + Math.floor(index / maxCols) * rect.height - this._scrollY;
		return rect;
	};
	
	Window_ReplayBase.prototype.drawItemImage = function(index) {
		var name = this.getImage(index);
		if(name == '') name = 'no_image';
		var rect = this.itemRect(index);
		this.drawThum(name, rect.x + 1, rect.y + 1, rect.width-2, rect.height-2);
	};
	
	Window_ReplayBase.prototype.drawThum = function(name, x, y, width, height) {
		var bitmap = ImageManager.loadThum(name);
		var pw = 160;
		var ph = 120;
		var sw = Math.min(width, pw);
		var sh = Math.min(height, ph);
		var dx = Math.floor(x + Math.max(width - pw, 0) / 2);
		var dy = Math.floor(y + Math.max(height - ph, 0) / 2);
		var sx = (pw - sw) / 2;
		var sy = (ph - sh) / 2;
		this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy);
		
		// 画像が読み込めてない
		if( !bitmap.isReady() ){
			this._reload = true;
			return;
		}
	};
	
	Window_ReplayBase.prototype.getImage = function(index) {
		return '';
	};
	
	Window_ReplayBase.prototype.fileLoad = function() {
		this._mLoadData = [];
	};
	
	Window_ReplayBase.prototype.update = function() {
		Window_FreeCommand.prototype.update.call(this);
		if(this._reload){
			this._reload = false;
			this.refresh();
		}
	};
	

	
	//-----------------------------------------------------------------------------
	// Window_RP
	
	function Window_RP() {
		this.initialize.apply(this, arguments);
	}

	Window_RP.prototype = Object.create(Window_ReplayBase.prototype);
	Window_RP.prototype.constructor = Window_RP;

	Window_RP.prototype.initialize = function(x, y) {
		Window_ReplayBase.prototype.initialize.call(this, x, y);
	};
	
	Window_RP._lastCommandSymbol = null;

	Window_RP.initCommandPosition = function() {
		this._lastCommandSymbol = null;
	};
	
	Window_RP.prototype.fileLoad = function() {
		this._mLoadData = [];
		// ファイル読み込み
		var fs = require('fs');
		var filepath = $advSystem.localFileDirectoryPath()+argRPtext+TS_Function.getScenarioExtension();
		var file_data = fs.readFileSync(filepath, 'utf-8');
		// 読み込んだデータを配列に入れる
		var s_list = file_data.split('\n');
		// =======================================================
		// ループ開始
		for(var i=0, len=s_list.length; i<len; i++){
			if( $advSystem.chomp(s_list[i]) == '' ) continue;
			s_list[i] = $advSystem.chomp(s_list[i]);
			var s = s_list[i].split(',');
			temp = {
				'ID'   : s[0], // ID
				'NUM'  : s[1], // 何番目か
				'THUM' : s[2], // サムネのCG
				'FILE' : s[3], // 呼び出すシナリオのファイル名兼、変数名
			}
			if( this._mLoadData[parseInt(s[0])] == null ) this._mLoadData[parseInt(s[0])] = [];
			this._mLoadData[parseInt(s[0])].push(temp);
		}
	};

	Window_RP.prototype.addMainCommands = function() {
		
		var data_list = this._mLoadData;
		var id_cnt = 0;
		for(var i=0, len=this._mLoadData.length; i<len; i++){
			var data = data_list[i];
			if( data == null ) continue;
			id_cnt++;
			this.addCommand(data[0].ID, data[0].THUM, this.checkOpen(id_cnt), id_cnt);
		}
	};
	
	Window_RP.prototype.processOk = function() {
		Window_RP._lastCommandSymbol = this.currentSymbol();
		Window_Command.prototype.processOk.call(this);
	};

	Window_RP.prototype.selectLast = function() {
		this.selectSymbol(Window_RP._lastCommandSymbol);
	};
	
	// サムネイル名取得
	Window_RP.prototype.getImage = function(index) {
		var output = '';
		var id = index+1;
		var data_list = this._mLoadData[id];
		if( this.checkOpen(id) ){
			output = data_list[0].THUM;
		}
		
		return output;
	};
	
	// 解放されているかチェック
	Window_RP.prototype.checkOpen = function(id) {
		var output = false;
		var data_list = this._mLoadData[id];
		
		if( data_list == null ) return output;
		
		for(var i=0, len=data_list.length; i<len; i++){
			var data = data_list[i];
			if( $CommonSave.check(data.FILE) ){
				output = true;
				break;
			}
		}
		return output;
	};
	
	// 解放状態の取得
	Window_RP.prototype.getOpenList = function(id) {
		var output = [];
		var data_list = this._mLoadData[id];
		for(var i=0, len=data_list.length; i<len; i++){
			var data = data_list[i];
			output.push( { id:i, enabled:$CommonSave.check(data.FILE), text:data.NUM, file:data.FILE } )
		}
		
		return output;
	};
	
	
	
	
	//-----------------------------------------------------------------------------
	// Window_RPSel
	
	function Window_RPSel() {
		this.initialize.apply(this, arguments);
	}

	Window_RPSel.prototype = Object.create(Window_FreeCommand.prototype);
	Window_RPSel.prototype.constructor = Window_RPSel;

	Window_RPSel.prototype.initialize = function(col, x, y, iw) {
		this._mSelData = [];
		Window_FreeCommand.prototype.initialize.call(this, col, x, y, iw);
	};
	
	Window_RPSel._lastCommandSymbol = null;

	Window_RPSel.initCommandPosition = function() {
		this._lastCommandSymbol = null;
	};
	
	Window_RPSel.prototype.makeCommandList = function() {
		this.addMainCommands();
	};

	Window_RPSel.prototype.addMainCommands = function() {
		var data_list = this._mSelData;
		for(var i=0, len=data_list.length; i<len; i++){
			var data = data_list[i];
			this.addCommand(data.text, 'ok', data.enabled, data.file);
		}
		if( this._mSelData.length > 0 ){
			this.height = this.windowHeight();
		}
	};
	
	Window_RPSel.prototype.setData = function(data) {
		this._mSelData = data;
		this.select(0);
	};
	
	
	
	//-----------------------------------------------------------------------------
	// Window_CG
	
	function Window_CG() {
		this.initialize.apply(this, arguments);
	}

	Window_CG.prototype = Object.create(Window_ReplayBase.prototype);
	Window_CG.prototype.constructor = Window_CG;

	Window_CG.prototype.initialize = function(x, y) {
		Window_ReplayBase.prototype.initialize.call(this, x, y);
	};

	Window_CG._lastCommandSymbol = null;

	Window_CG.initCommandPosition = function() {
		this._lastCommandSymbol = null;
	};
	
	Window_CG.prototype.fileLoad = function() {
		this._mLoadData = [];
		// ファイル読み込み
		var fs = require('fs');
		var filepath = $advSystem.localFileDirectoryPath()+argCGtext+TS_Function.getScenarioExtension();
		var file_data = fs.readFileSync(filepath, 'utf-8');
		// 読み込んだデータを配列に入れる
		var s_list = file_data.split('\n');
		// =======================================================
		// ループ開始
		for(var i=0, len=s_list.length; i<len; i++){
			if( $advSystem.chomp(s_list[i]) == '' ) continue;
			var s = s_list[i].split(':');
			temp = {
				'ID'   : s[0], // ID
				'THUM' : s[1], // サムネのCG
				'LIST' : s[2], // そのシーンのCGリスト
			}
			temp['LIST'] = $advSystem.chomp(temp['LIST']).split(',');
			temp['LIST'] = temp['LIST'].filter(function(e){return e !== "";});

			this._mLoadData[parseInt(s[0])] = temp;
		}
	};

	Window_CG.prototype.addMainCommands = function() {
		var data_list = this._mLoadData;
		var id_cnt = 0;
		for(var i=0, len=this._mLoadData.length; i<len; i++){
			var data = data_list[i];
			if( data == null ) continue;
			id_cnt++;
			this.addCommand(data.ID, data.THUM, this.checkOpen(id_cnt), id_cnt);
		}
	};

	Window_CG.prototype.processOk = function() {
		Window_CG._lastCommandSymbol = this.currentSymbol();
		Window_Command.prototype.processOk.call(this);
	};

	Window_CG.prototype.selectLast = function() {
		this.selectSymbol(Window_CG._lastCommandSymbol);
	};
	
	// サムネイル名取得
	Window_CG.prototype.getImage = function(index) {
		var output = '';
		var id = index+1;
		if( this.checkOpen(id) ){
			output = this._mLoadData[id].THUM;
		}
		return output;
	};
	
	// 解放されているかチェック
	Window_CG.prototype.checkOpen = function(id) {
		return this.openList(id).length > 0;
	};
	
	// 解放されているかチェック
	Window_CG.prototype.openList = function(id) {
		var output = [];
		if( this._mLoadData[id] == null ) return output;
		var data_list = this._mLoadData[id]['LIST'];
		for(var i=0, len=data_list.length; i<len; i++){
			var cg_name = data_list[i];
			if( $CommonSave.check(cg_name) ){
				output.push(cg_name);
			}
		}
		
		return output;
	};
	
	// 解放リスト一覧
	Window_CG.prototype.openAllList = function() {
		var output = [];
		for(var i=1, len=this._mLoadData.length; i<len; i++){
			var id = i;
			var list = this.openList(id);
			if( list.length > 0 ) output.push([id,list]);
		}
		return output;
	};
	
	
	Window_CG.prototype.drawAllItems = function() {
		Window_FreeCommand.prototype.drawAllItems.call(this);
		if( this._mPlayBack ) this.drawPict();
	};
	
	Window_CG.prototype.drawPict = function() {
		var name = this._mCgList[this._mCgCnt];
		
		//var picture = new Game_Picture();
		//picture.show('ev01.png', 0, 0, 0, 100, 100, 255, 0);
		//$gameScreen._pictures[this._mPictureId] = picture;
		/*
		var bitmap = ImageManager.loadPicture(name);
		var sw = Graphics.boxWidth;
		var sh = Graphics.boxHeight;
		var dx = 200;
		var dy = 200;
		var sx = 400;
		var sy = 400;
		this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy);
		*/
		
		/*
		var bitmap = ImageManager.loadPicture(name);
		this._mCgSprite = new Sprite();
		this._mCgSprite.bitmap = bitmap;
		this.addChildToBack(this._mCgSprite);
		*/
	};
	
	
	//-----------------------------------------------------------------------------
	// Window_CGView
	
	function Window_CGView() {
		this.initialize.apply(this, arguments);
	}

	Window_CGView.prototype = Object.create(Window_Selectable.prototype);
	Window_CGView.prototype.constructor = Window_CGView;

	Window_CGView.prototype.initialize = function() {
		this._mCgList = [];
		this._mCgAllList = [];
		this._mCgCnt  = 0;
		this._mCgId   = 0;
		this._mPlayBack   = false;
		Window_Selectable.prototype.initialize.call(this, 0, 0, Graphics.boxWidth, Graphics.boxHeight);
		this.createSprites();
	};
	
	Window_CGView.prototype.createSprites = function() {
		this._cgSprite = new Sprite();
		this._cgSprite.bitmap = null;
		this._cgSprite.opacity = 255;
		this._cgSprite.visible = false;
		this.addChild(this._cgSprite);
	}
	
	Window_CGView.prototype.set = function(list, id) {
		this._mCgAllList = list;
		for(var i=0, len=list.length; i<len; i++){
			if( list[i][0] == id ){
				this._mCgList = list[i][1];
				this._mCgId = i;
			}
		}
	};
	
	Window_CGView.prototype.standardBackOpacity = function() {
		return 0;
	};
	
	// ギャラリー開始
	Window_CGView.prototype.playBackStart = function() {
		//this._mCgList     = this.openList( this.currentExt() );
		this._mCgCnt      = 0;
		this._mPlayBack   = true;
		this._cgSprite.visible = true;
		
		this.refresh();
	};
	
	// ギャラリー：前の画像
	Window_CGView.prototype.playBackPrev = function() {
		this.changeCgStep(-1);
		this.refresh();
	};
	
	// ギャラリー：次の画像
	Window_CGView.prototype.playBackNext = function() {
		this.changeCgStep(1);
		this.refresh();
	};
	
	
	// ギャラリー終了
	Window_CGView.prototype.playBackEnd = function() {
		this._mCgCnt = 0;
		this._mPlayBack = false;
		this._cgSprite.visible = false;
	};
	
	// 画像の変更（差分）
	Window_CGView.prototype.changeCgStep = function(num) {
		this._mCgCnt += num;
		if( this._mCgCnt >= this._mCgList.length ){
			// 次のシーン
			this.changeCgScene(1);
		}else if( this._mCgCnt < 0 ){
			// 前のシーン
			this.changeCgScene(-1);
			this._mCgCnt = this._mCgAllList[this._mCgId][1].length-1;
		}
	};
	
	// 画像の変更（ID）
	Window_CGView.prototype.changeCgScene = function(num) {
		this._mCgCnt = 0;
		this._mCgId += num;
		
		if( this._mCgId >= this._mCgAllList.length ){
			// 最後のシーンなので最初に戻る
			this._mCgId = 0;
		}else if( this._mCgId < 0 ){
			// 最初のシーンなので最後に進める
			this._mCgId = this._mCgAllList.length-1;
		}
		
		this._mCgList = this._mCgAllList[this._mCgId][1];
		
	};
	
	
	Window_CGView.prototype.refresh = function() {
		this.contents.clear();
		if (this._mPlayBack) {
			var cg_id = this._mCgList[this._mCgCnt];
			this.drawPict( cg_id );
			//this.drawCharacter("Actor1",1,200,200);
		}
	};
	
	Window_CGView.prototype.drawPict = function(name) {
		
		/*
		var actor = $gameActors.actor(1);
		if(actor){
			// 髪色を反映
			name += actor.getHairName();
		}
		*/
		
		var bitmap = ImageManager.loadPicture(name);
		this._cgSprite.bitmap = bitmap;
	};
	
	// カーソルのキーにも判定させる
	Window_CGView.prototype.processCursorMove = function() {
		if (this.isOpenAndActive() && this._mPlayBack) {
			var change = false;
			
			if (Input.isRepeated('down')) {
				this.changeCgScene(1);
				change = true;
			}
			if (Input.isRepeated('up')) {
				this.changeCgScene(-1);
				change = true;
			}
			if (Input.isRepeated('right')) {
				this.changeCgStep(1);
				change = true;
			}
			if (Input.isRepeated('left')) {
				this.changeCgStep(-1);
				change = true;
			}
			if (!this.isHandled('pagedown') && Input.isTriggered('pagedown')) {
				this.changeCgScene(1);
				change = true;
			}
			if (!this.isHandled('pageup') && Input.isTriggered('pageup')) {
				this.changeCgScene(-1);
				change = true;
			}
			
			if( change ){
				this.refresh();
			}
		}
	};
	
	// ○プラグインコマンド拡張
	var _TS_ReplayMode_Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
	Game_Interpreter.prototype.pluginCommand = function (command, args) {
		_TS_ReplayMode_Game_Interpreter_pluginCommand.call(this, command, args);
		if (command === 'AdvReplay') {
			if( args[0] == 'start' ){
				$advSystem.replayStart();
			}else if( args[0] == 'end' ){
				// 回想モード終了
				// マップ→メニュー→回想の流れを作る
				SceneManager._stack.push(Scene_Map);
				SceneManager._stack.push(Scene_Menu);
				SceneManager.goto(Scene_Replay);
			}
		}
		if (command === 'AdvReplayDebug') {
			switch(args[0]){
				case 'CG':
					CGAllOpen();
					break;
				case 'RP':
					ReplayAllOpen();
					break;
			}
		}
		if (command === 'ReplaySave') {
			$CommonSave.set(args[0],true);
		}
	};
	
	//======================================
	// デバッグ用処理
	//======================================
	// RP全開放
	ReplayAllOpen = function() {
		// ファイル読み込み
		var fs = require('fs');
		var filepath = $advSystem.localFileDirectoryPath()+argRPtext+TS_Function.getScenarioExtension();
		var file_data = fs.readFileSync(filepath, 'utf-8');
		//Commented for .txt usage instead of .sl
		/*if(!$gameTemp.isPlaytest() || argTsDecodeDebug){
			var text_ary = file_data.split('');
			for (var i = 0; i < text_ary.length; i++) {
				text_ary[i] = String.fromCharCode(text_ary[i].charCodeAt(0) ^ argTsDecodeKey);
			}
			file_data = text_ary.join('');
		}*/
		
		// 読み込んだデータを配列に入れる
		var s_list = file_data.split('\n');
		// =======================================================
		// ループ開始
		for(var i=0, len=s_list.length; i<len; i++){
			if( $advSystem.chomp(s_list[i]) == '' ) continue;
			s_list[i] = $advSystem.chomp(s_list[i]);
			var s = s_list[i].split(',');
			$CommonSave.set(s[3],true);
		}
	};
	
	// CG全開放
	CGAllOpen = function() {
		// ファイル読み込み
		var fs = require('fs');
		var filepath = $advSystem.localFileDirectoryPath()+argCGtext+TS_Function.getScenarioExtension();
		var file_data = fs.readFileSync(filepath, 'utf-8');
		//Commented for .txt usage instead of .sl
		/*if(!$gameTemp.isPlaytest() || argTsDecodeDebug){
			var text_ary = file_data.split('');
			for (var i = 0; i < text_ary.length; i++) {
				text_ary[i] = String.fromCharCode(text_ary[i].charCodeAt(0) ^ argTsDecodeKey);
			}
			file_data = text_ary.join('');
		}*/
		
		// 読み込んだデータを配列に入れる
		var s_list = file_data.split('\n');
		// =======================================================
		// ループ開始
		for(var i=0, len=s_list.length; i<len; i++){
			if( $advSystem.chomp(s_list[i]) == '' ) continue;
			var s = s_list[i].split(':');
			var list = s[2];
			list = list.split(',');
			for(var j=0, cg_len=list.length; j<cg_len; j++){
				if( s_list[i] == '' ) continue;
				$CommonSave.set(list[j],true);
			}
		}
	};
	
	// 
	CGOpenRate = function() {
		// ファイル読み込み
		var fs = require('fs');
		var filepath = $advSystem.localFileDirectoryPath()+argCGtext+TS_Function.getScenarioExtension();
		var file_data = fs.readFileSync(filepath, 'utf-8');
		
		// 読み込んだデータを配列に入れる
		var s_list = file_data.split('\n');
		
		var max_cnt =0;
		var now_cnt =0;
		
		// =======================================================
		// ループ開始
		for(var i=0, len=s_list.length; i<len; i++){
			if( $advSystem.chomp(s_list[i]) == '' ) continue;
			var s = s_list[i].split(':');
			var list = s[2];
			list = list.split(',');
			for(var j=0, cg_len=list.length; j<cg_len; j++){
				if( s_list[i] == '' ) continue;
				if( $CommonSave.check(list[j].trim()) ){
					now_cnt++;
				}else{
					console.log(list[j]);
				}
				max_cnt++;
				
				
			}
		}
		
		console.log('CG_RATE '+now_cnt+'/'+max_cnt);
	};
	
	
})();
