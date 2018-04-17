//=========================================================
// TS_OptionWindowAlpha
//=========================================================

/*:ja
 * @plugindesc
 * オプションにウィンドウ透過度入れ
 */

/*:
 
*/

(function() {
	
	// 引数
	
	//****************************************************************************
	// オプション設定拡張
	//****************************************************************************
	
	//---------------------------------
	// ConfigManagerの変更
	//---------------------------------
	
	// ○コマンドを自由に追加できるようにする
	var _TS_OptionConf_ConfigManager_makeData = ConfigManager.makeData;
	ConfigManager.makeData = function() {
		var config = _TS_OptionConf_ConfigManager_makeData.call(this);
		config = this.addConfigData(config);
		return config;
	};
	
	// △ここに追加したいオプションを入れる
	var _TS_OptionConf_Window_Options_makeCommandList = Window_Options.prototype.makeCommandList;
	ConfigManager.addConfigData = function(config) {
		return config;
	};
	
	//****************************************************************************
	// ウィンドウ透過度追加
	//****************************************************************************
	
	// ○透過度追加
	var _TS_OptionWindowAlpha_Window_Options_addOptionCommand = Window_Options.prototype.addOptionCommand;
	Window_Options.prototype.addOptionCommand = function() {
		_TS_OptionWindowAlpha_Window_Options_addOptionCommand.apply(this, arguments);
		this.addCommand('Window Menu Opacity', 'windowOpacity');
	};
	
	// ●（書き換え） 値を影響させる
	Window_Base.prototype.standardBackOpacity = function() {
		var setAlpha = ConfigManager['windowOpacity'];
		this._windowFrameSprite.alpha = (1 / 255) * setAlpha;
		return ConfigManager['windowOpacity'];
	};

	//---------------------------------
	// ConfigManagerの変更
	//---------------------------------
	
	// 初期値
	ConfigManager.windowOpacity = 255; 
	
	// ○透過度追加
	var _TS_OptionWindowAlpha_ConfigManager_addConfigData = ConfigManager.addConfigData;
	ConfigManager.addConfigData = function(config) {
		config.windowOpacity = this.windowOpacity;
		return config;
	};
	
	// ○透過度追加
	var _TS_OptionWindowAlpha_ConfigManager_applyData = ConfigManager.applyData;
	ConfigManager.applyData = function(config) {
		_TS_OptionWindowAlpha_ConfigManager_applyData.apply(this, arguments);
		this.windowOpacity = this.readOpacity(config, 'windowOpacity');
	};
	
	
	
})();
