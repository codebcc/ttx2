/**
 * @author Stefan Hoth <sh@jnamic.com>
 * @created 2011/09/24
 */

//some constants which might prove useful
TT2CONSTANTS = {
	COLUMNS: 40,
	LINES: 25,
    BLOCKX: 16,
    BLOCKY: 20
}

TT2CONTANTS = $.extend(TT2CONSTANTS, {
    CANVASHEIGHT: (TT2CONSTANTS.LINES * TT2CONSTANTS.BLOCKY),
    CANVASWIDTH: (TT2CONSTANTS.COLUMNS * TT2CONSTANTS.BLOCKX)
})
//some variables

//color info model
COLORS = {
    red:{
    	name: "Red",
    	rgb: [255,  47,  21],
		hex: "f00",
        sname: "R",
        contrast: "ccc",
        textCC: 129,
        graphicsCC: 145
    },
    yellow: {
    	name: "Yellow",
    	rgb: [255, 253,  51],
		hex: "ff0",
        sname: "Y",
        contrast: "666",
        textCC: 131,
        graphicsCC: 147
    },
    blue: {
    	name: "Blue",
    	rgb: [  0,  39, 252],
		hex: "00f",
        sname: "BL",
        contrast: "ccc",
        textCC: 132,
        graphicsCC: 148
    },
    magenta: {
    	name: "Magenta",
    	rgb: [255,  63, 253],
		hex: "f0f",
        sname: "M",
        contrast: "666",
        textCC: 133,
        graphicsCC: 149
    },
    green: {
    	name: "Green",
    	rgb: [  0, 250,  44],
		hex: "0f0",
        sname: "G",
        contrast: "666",
        textCC: 130,
        graphicsCC: 146
    },
    cyan: {
    	name: "Cyan",
    	rgb: [  0, 252, 255],
		hex: "0ff",
        sname: "C",
        contrast: "666",
        textCC: 134,
        graphicsCC: 150
    },
    black: {
    	name: "Black",
    	rgb: [  0,   0,   0],
		hex: "000",
        sname: 'BK',
        contrast: "ccc"
    },
    white: {
    	name: "White",
    	rgb: [255, 255, 255],
		hex: "fff",
        sname: "W",
        contrast: "666",
        textCC: 135,
        graphicsCC: 151
    }
}

var ccs = {
    b_r: {
        unicode: "014E",
        title: "Background Red"
    },
    b_y: {
        unicode: "014F",
        title: "Background Yellow"
    },
    b_bl: {
        unicode: "0150",
        title: "Background Blue"
    },
    b_m: {
        unicode: "0151",
        title: "Background Magenta"
    },
    b_c: {
        unicode: "0153",
        title: "Background Cyan"
    },
    b_g: {
        unicode: "0152",
        title: "Background Green"
    },
    b_n: {
        unicode: "0145",
        title: "New Background"
    },
    b_bk: {
        unicode: "0145",
        title: "Background Black"
    },
    b_w: {
        unicode: "0154",
        title: "Background White"
    },
    g_r: {
        unicode: "0147",
        title: "Graphics Red"
    },
    g_y: {
        unicode: "0148",
        title: "Graphics Yellow"
    },
    g_bl: {
        unicode: "0149",
        title: "Graphics Blue"
    },
    g_m: {
        unicode: "014A",
        title: "Graphics Magenta"
    },
    g_g: {
        unicode: "014B",
        title: "Graphics Green"
    },
    g_c: {
        unicode: "014C",
        title: "Graphics Cyan"
    },
    g_w: {
        unicode: "014D",
        title: "Graphics White"
    },
    t_r: {
        unicode: "014E",
        title: "Text Red"
    },
    t_y: {
        unicode: "014F",
        title: "Text Yellow"
    },
    t_bl: {
        unicode: "0150",
        title: "Text Blue"
    },
    t_m: {
        unicode: "0151",
        title: "Text Magenta"
    },
    t_g: {
        unicode: "0152",
        title: "Text Green"
    },
    t_c: {
        unicode: "0153",
        title: "Text Cyan"
    },
    t_w: {
        unicode: "0154",
        title: "Text White"
    }
}

//Teletext2 Block prototype
function TT2Block(){
	
	this.character = "";
	this.bgColor = "";
	this.fgColor = "";
	
	//which font should be used? text or image font, default to text
	this.isImage = false;
	
	//if this has a value we are part of an paint area
	//this should store some id for the paint area so we can kill/modify it later
	this.paintAreaId = null;
	
	//boolean map if a sub block is filled or not
	this.subMap = new Array();
}

/**
 * to which paint area is this block belonging to?
 * @return boolean is part of the given paint area or not
 */
TT2Block.prototype.belongsTo = function(paintAreaId){
	return this.paintArea == paintAreaId;
}

//represents one line
function TT2Line(){
	this.blocks = new Array(TT2CONSTANTS.COLUMNS);
}

/**
 * retrieves all blocks belonging to a given paint area id
 * @return array of blocks of this line belonging to the given paint area id
 */
TT2Line.prototype.blocksForPaintAreaId = function(id){
	
	paintAreaBlocks = new Array();
	
	for (key in this.blocks){
	  if( this.blocks[key].belongsTo(id) ){
	  	paintAreaBlocks.push(this.blocks[key]);
	  }
	}
	
	return paintAreaBlocks;
}

//represents the page
function TT2Page(){
	this.defaults = {
		color_bg: TT2COLOR.BLACK,
		color_fg: TT2COLOR.WHITE
	};
	
	this.lines = new Array(TT2CONSTANTS.LINES);
}

//represents a paint area
function TT2PaintArea(){
	
	this.width = 0;
	this.height = 0;
	
	this.startCol = 0;
	this.startRow = 0;
}

