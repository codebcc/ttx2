/**
 * @author Stefan Hoth <sh@jnamic.com>
 * @created 2011/09/24
 */

//some constants which might prove useful
TT2CONSTANTS = {
	COLUMNS: 40,
	LINES: 25,
    BLOCKX: 12,
    BLOCKY: 20
}

TT2CONTANTS = $.extend(TT2CONSTANTS, {
    CANVASHEIGHT: (TT2CONSTANTS.LINES * TT2CONSTANTS.BLOCKY),
    CANVASWIDTH: (TT2CONSTANTS.COLUMNS * TT2CONSTANTS.BLOCKX)
})
//some variables

//color info model
TT2COLOR = {
	
    RED:{
    	name: "Red",
    	rgb: [255,  47,  21],
		hex: "f00",
        sname: "R",
        contrast: "ccc",
        textCC: 129,
        graphicsCC: 145
    },
    YELLOW: {
    	name: "Yellow",
    	rgb: [255, 253,  51],
		hex: "ff0",
        sname: "Y",
        contrast: "666",
        textCC: 131,
        graphicsCC: 147
    },
    BLUE: {
    	name: "Blue",
    	rgb: [  0,  39, 252],
		hex: "00f",
        sname: "BL",
        contrast: "ccc",
        textCC: 132,
        graphicsCC: 148
    },
    MAGENTA: {
    	name: "Magenta",
    	rgb: [255,  63, 253],
		hex: "f0f",
        sname: "M",
        contrast: "666",
        textCC: 133,
        graphicsCC: 149
    },
    GREEN: {
    	name: "Green",
    	rgb: [  0, 250,  44],
		hex: "0f0",
        sname: "G",
        contrast: "666",
        textCC: 130,
        graphicsCC: 146
    },
    CYAN: {
    	name: "Cyan",
    	rgb: [  0, 252, 255],
		hex: "0ff",
        sname: "C",
        contrast: "666",
        textCC: 134,
        graphicsCC: 150
    },
    BLACK: {
    	name: "Black",
    	rgb: [  0,   0,   0],
		hex: "000",
        sname: 'BK',
        contrast: "ccc"
    },
    WHITE: {
    	name: "White",
    	rgb: [255, 255, 255],
		hex: "fff",
        sname: "W",
        contrast: "666",
        textCC: 135,
        graphicsCC: 151
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

