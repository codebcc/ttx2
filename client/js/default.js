var a = lastX =  lastY = 0;
var stickycursor = tools = canvas = cursor = cavaswrapper = $();
var gridX = new Array();
var gridY = new Array();
var canvasInit = true;
var blockX = 12;
var blockY = 14;
var canvasWidth = 480;
var canvasHeight = 322;

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
    
    //Setup shortcut keys
    CANVAS.keys();
});

var TOOLS = {
    build: function() {
        //make the phisical buttons
        tools.find("div").each(function(j) {		
            for(i in PALETTE) {
                $(this).append('<a href="#" class="' + PALETTE[i].name + '" id="' + $(this).attr("id") + '-' + PALETTE[i].name + '" title="' + $(this).attr("title") + " " + PALETTE[i].name + '" style="background-position: left ' + (0-a) + 'px"></a>');
                a=a+13;
            };
            a=a+(j*8);
            a = a - ((j==1) ? 9 : 0);
        });

        //click action
        tools.find("a").click(function() {
            CANVAS.addCC({elem: $(this)}); 
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
        }
    },
    keys: function() {
		$(document).keydown(function(event) {
			//u: 38, d: 40, l: 37, r: 39
			if($("body.canvas").length>0) {
				event.preventDefault();
				ct = parseInt(cursor.css("top"));
				cl = parseInt(cursor.css("left"));
				if(event.which==38) {
					//up
					if(ct >= blockY) cursor.css("top", (ct-blockY) + "px");
				} else if(event.which==40) {
					//down
					if(ct<(canvasHeight-blockY)) cursor.css("top", (ct+blockY) + "px");
				} else if(event.which==37) {
					//left
					if(cl>=blockX) cursor.css("left", (cl-blockX) + "px");
				} else if(event.which==39) {
					//right
					if(cl<(canvasWidth-blockX)) cursor.css("left",(cl+blockX) + "px");
				}
			}
		});	
    },
    addCC: function(o) {
        if(stickycursor.length<1) return false; //no sticky cursor - get outta here!

        //remove any control character at this position
        $('.control[style*="' + stickycursor.attr("style") + '"]').remove();

        palette = PALETTE[o.elem.attr("class")];
        id = o.elem.parent().attr("id");
        cls = "control " + o.elem.attr("class");
        cls += (id=="backgroundcolor") ? " background" : " foreground";
        cls += (id.indexOf("graphics")>-1) ? " graphics" : ""; 
        style = stickycursor.attr("style");
        ctrl = $("<span>").attr({class: cls, style: stickycursor.attr("style")}).text(palette.sname);
        canvas.append(ctrl);
        return false;
    },
    cursorInit: function() {
        canvas.append('<div id="cursor">');
        cursor = $("#cursor");
        
		canvaswrapper.hover(function(){
			$("body").addClass("canvas");
			$(this).bind("mousemove", function(e) {
                CANVAS.grid.snap({x: e.clientX, y: e.clientY});
			}).click(function() {
                stickycursor.remove();
                a = cursor.clone();
                canvas.append(a.attr("id", "stickycursor"));
                stickycursor = $("#stickycursor");

                stickycursor.draggable({ revert: true, grid: [blockX,blockY], cursorAt: { left: 5 } });
            });
		}, 
		function() {
			$("body").removeClass("canvas");
			$(this).unbind("mousemove");	
		});
	
    }
}

var PALETTE = {
	black: {
		name: "black",
		color: "000",
        sname: 'BK',
        contrast: "ccc"
	},
	red: {
		name: "red",
		color: "f00",
        sname: "R",
        contrast: "ccc"
	},
	green: {
		name: "green",
		color: "0f0",
        sname: "G",
        contrast: "666"
    },
	yellow: {
		name: "yellow",
		color: "ff0",
        sname: "Y",
        contrast: "666"
	},
	blue: {
		name: "blue",
		color: "00f",
        sname: "BL",
        contrast: "ccc"
	},	
	magenta: {
		name: "magenta",
		color: "f0f",
        sname: "M",
        contrast: "666"
	},	
	cyan: {
		name: "cyan",
		color: "0f0",
        sname: "C",
        contrast: "666"
	},	
	white: {
		name: "white",
		color: "fff",
        sname: "W",
        contrast: "666"
	}
};

Array.min = function( array ){
        return Math.min.apply( Math, array );
};

