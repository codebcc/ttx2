var lastX =  lastY = 0;
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

    //Setup shortcut keys
    CANVAS.keys.init();

    //Add cursor
    CURSOR.cursorInit();
});

var TOOLS = {
    build: function() {
        var a = 0;
        //make the phisical buttons
        //OMG this is dirty but buttons will change ASAP
        tools.find("div").each(function(j) {		
            for(i in TT2COLOR) {
                $(this).append('<a href="#" class="' + TT2COLOR[i].name + '" id="' + $(this).attr("id") + '-' + TT2COLOR[i].name + '" title="' + $(this).attr("title") + " " + TT2COLOR[i].name + '" style="background-position: left ' + (0-a) + 'px"></a>');
                a=a+13; //13 = pixelheight of sprites
            };
            a=a+(j*8); //8 = amount of tools in a group
            a = a - ((j==1) ? 9 : 0); //correct sprite positions
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
            $(".container").css({
                height: canvasHeight,
                width: canvasWidth
            });
            $(".cursor").css({
                height: blockY,
                width: blockX
            });
            //build our array of grid pixel positions
            for(a=0; a<=canvas.width(); a+=blockX) {
                //x-axis
                gridX.push(a);
            }
            var rowCount=0;
            for(a=0; a<=canvas.height(); a+=blockY) {
                //y-axis
                gridY.push(a);
                //add horizontal divs
                canvas.append('<div class="row y' + a + '" id="row' + rowCount + '" style="height:' + blockY + 'px">');
                rowCount++;
            }
            $("div.row").click(function() {
                stickycursor.remove();
                a = cursor.clone();
                $(this).append(a.attr("id", "stickycursor"));
                stickycursor = $("#stickycursor");
            });

        },
        snap: function(o) {
            o.x = (Math.round(o.x/blockX)*blockX);
            o.y = (Math.round(o.y/blockY)*blockY);
            cursor.css('left', o.x).css('top', o.y);
        },
        node: {
            get: {
                //get a nodes position on the grid
                top: function(elem) {
                    return parseInt(elem.css("top"))
                },
                left: function(elem) {
                    return parseInt(elem.css("left"))
                },
                row: function(elem) {
                    return elem.parents("div.row").attr("id");
                }
            },
            move: {
                //move a node in a particular direction
                right: function(elem) {
                    if(CANVAS.grid.node.at.right(elem)) return false;
                    elem.css("left", (CANVAS.grid.node.get.left(elem) + blockX));
                }
            },
            at: {
                //is a node at the edge of the screen?
                right: function(elem) {
                    if((CANVAS.grid.node.get.left(elem)+blockX)==canvasWidth) return true;
                }
            }
        }
    },
    keys: {
        init: function() {
            $(document).keydown(function(event) {
                if($("body.canvas").length>0) CANVAS.keys[event]();
            });
        },
        38: function() {
            //up
            CANVAS.node.move.up(cursor);
        },
        40: function() {
            //down
            CANVAS.node.move.down(cursor);
        },
        37: function() {
            //left
            CANVAS.node.move.left(cursor);
        },
        39: function() {
            //right
            CANVAS.node.move.right(cursor);
        }
    },
    addCC: function(o) {
        if(stickycursor.length<1) return false; //no sticky cursor - get outta here!

        //if we're at the right hand side, also get outta here!
        if(CANVAS.grid.node.at.right(o.elem)) return false;

        //remove any control character at this position
        $('.control[style*="' + stickycursor.attr("style") + '"]').remove();

        palette = TT2COLOR[o.elem.attr("class").toUpperCase()]; //this is our colour
        id = o.elem.parent().attr("id"); //this is the description of our tool
        cls = "control cursor " + o.elem.attr("class"); //this is the color
        cls += (id=="backgroundcolor") ? " background" : " foreground";
        cls += (id.indexOf("graphics")>-1) ? " graphics" : ""; 
        style = stickycursor.attr("style");
        ctrl = $("<span>").attr({class: cls, style: stickycursor.attr("style")}).text(palette.sname);
        ctrlWrapper = $("<div>");
        stickycursor.parents("div.row").append(ctrl);
        CANVAS.grid.node.move.right(stickycursor);
        return false;
    }
}

var CURSOR = {
    x: function() {
        return parseInt(cursor.css("left"));
    },
    y: function() {
        return parseInt(cursor.css("top"));
    },
    cursorInit: function() {
        canvas.append('<div id="cursor" class="cursor">');
        cursor = $("#cursor");
        
		canvaswrapper.hover(function(){
			$("body").addClass("canvas");
			$(this).bind("mousemove", function(e) {
                CANVAS.grid.snap({x: e.clientX, y: e.clientY});
			}).click(function() {
                stickycursor.remove();
                a = cursor.clone().attr("id","stickycursor").css("top","0");
                $('div.row.y' + CURSOR.y()).append(a);
                stickycursor = $("#stickycursor");
            });
		}, 
		function() {
			$("body").removeClass("canvas");
			$(this).unbind("mousemove");	
		});
    }
}

Array.min = function( array ){
    return Math.min.apply( Math, array );
};

