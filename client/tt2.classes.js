/**
 * @author Stefan Hoth <sh@jnamic.com>
 * @created 2011/09/24
 */

TT2COLOR = {
	
    RED:{
    	name: "Red",
    	rgb: [255,  47,  21]
    },
    YELLOW: {
    	name: "Yellow",
    	rgb: [255, 253,  51]
    },
    BLUE: {
    	name: "Blue",
    	rgb: [  0,  39, 252]
    },
    MAGENTA: {
    	name: "Magenta",
    	rgb: [255,  63, 253]
    },
    GREEN: {
    	name: "Green",
    	rgb: [  0, 250,  44]
    },
    CYAN: {
    	name: "Cyan",
    	rgb: [  0, 252, 255]
    },
    BLACK: {
    	name: "Black",
    	rgb: [  0,   0,   0]
    },
    WHITE: {
    	name: "White",
    	rgb: [255, 255, 255] 
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
	this.paintArea = null;
}

/**
 * to which paint area is this block belonging to?
 * @return boolean is part of the given paint area or not
 */
TT2Block.prototype.belongsTo = function(paintAreaId){
	return this.paintArea == paintAreaId;
}


