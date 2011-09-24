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
    CANVAS.grid.buildGrid();

    //Add cursor
    CANVAS.cursorInit();
});

var TOOLS = {
    build: function() {
        tools.find("div").each(function(j) {		
            for(i in PALETTE) {
                $(this).append('<a href="#" class="' + PALETTE[i].name + '" id="' + $(this).attr("id") + '-' + PALETTE[i].name + '" title="' + $(this).attr("title") + " " + PALETTE[i].name + '" style="background-position: left ' + (0-a) + 'px"></a>');
                a=a+13;
            };
            a=a+(j*8);
            a = a - ((j==1) ? 9 : 0);
        });
    }

}

var CANVAS = {
    grid: {
        buildGrid: function() {
            for(a=0; a<=canvas.width(); a+=blockX) {
                gridX.push(a);
            }
            for(a=0; a<=canvas.height(); a+=blockY) {
                gridY.push(a);
            }
        },
        snap: function(o) {
            o.x = (Math.round(o.x/blockX)*blockX);
            o.y = (Math.round(o.y/blockY)*blockY);
            cursor.css('left', o.x).css('top', o.y);
        },
        addCC: function(o) {
            
        }
    },
    cursorInit: function() {
        canvas.append('<div id="cursor">');
        cursor = $("#cursor");
        
		canvaswrapper.hover(function(){
			$(this).bind("mousemove", function(e) {
                CANVAS.grid.snap({x: e.clientX, y: e.clientY});
			});
		}, 
		function() {
			$(this).unbind("mousemove");	
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

Array.min = function( array ){
        return Math.min.apply( Math, array );
};

