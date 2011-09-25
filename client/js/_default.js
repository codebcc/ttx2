var a = lastX =  lastY = 0;
var tools = canvas = cursor = cavaswrapper = $();
var gridX = new Array();
var gridY = new Array();
var canvasInit = true;
var blockX = 12;
var blockY = 14;

$(document).ready(function () {

    tools = $("#tools");
    canvas = $("#canvas");
    canvaswrapper = $("#canvaswrapper");

    //Build tools
    TOOLS.build();

    //build grid
    //CANVAS.grid.buildGrid();

    //Add cursor
    CANVAS.cursorInit();
});

var TOOLS = {
    build: function() {
        tools.find("div").each(function(j) {		
            for(i in PALETTE) {
                $(this).append('<a href="#" id="' + $(this).attr("id") + '-' + PALETTE[i].name + '" title="' + $(this).attr("title") + " " + PALETTE[i].name + '" style="background-position: left ' + (0-a) + 'px"></a>');
                a=a+13;
            };
            a=a+(j*8);
            a = a - ((j==1) ? 9 : 0);
        });
    }

}

var CANVAS = {
    cursorInit: function() {
        canvas.append('<div id="cursor">');
        cursor = $("#cursor");
        cursor.draggable({
            grid: [blockX, blockY]
        });
    }
}

var PALETTE = {
	black: {
		name: "black",
		black: "000",
	},
	red: {
		name: "red",
		color: "f00"
	},
	green: {
		name: "green",
		color: "0f0"
	},
	yellow: {
		name: "yellow",
		color: "ff0"
	},
	blue: {
		name: "blue",
		color: "00f"
	},	
	magenta: {
		name: "magenta",
		color: "f0f"
	},	
	cyan: {
		name: "cyan",
		color: "0f0"
	},	
	white: {
		name: "white",
		color: "fff"
	}
};
