var lastX =  lastY = 0;
var stickycursor = tools = canvas = cursor = cavaswrapper = $();
var gridX = new Array();
var gridY = new Array();
var canvasInit = true;
var blockX = 12;
var blockY = 14;
var canvasWidth = 480;
var canvasHeight = 322;
var ccCount = 0;

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
            CANVAS.node.cc.addCC({elem: $(this)}); 
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
                //if we click a row add a sticky cursor to it
                stickycursor.remove();
                a = cursor.clone();
                CANVAS.node.cc.appendToInnermostChild($(this), a.attr("id", "stickycursor"));
                stickycursor = $("#stickycursor");
            });

        },
        snap: function(o) {
            o.x = (Math.round(o.x/blockX)*blockX);
            o.y = (Math.round(o.y/blockY)*blockY);
            cursor.css('left', o.x).css('top', o.y);
        },
        getColumnClasses: function(l, w) {
            cls = " ";
            for(i=l; i<=(l+w); i=(i+blockX)) {
                cls += ("x" + i + " ");
            }
            //xx is the column it starts in
            cls += "xx" + l;
            return cls;
        }

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
                if(CANVAS.node.at.right(elem)) return false;
                elem.css("left", (CANVAS.node.get.left(elem) + blockX));
            }
        },
        at: {
            //is a node at the edge of the screen?
            right: function(elem) {
                if((CANVAS.node.get.left(elem)+blockX)==canvasWidth) return true;
            }
        },
        cc: {
            removeCCHere: function(elem) {
                /* Remove any control character
                at this position */
                var r = CANVAS.node.get.row(elem); //get elements row
                var l = CANVAS.node.get.left(elem); //get elements left
                $("." + r).find(".control").each(function() { //loop through control characters
                    t = $(this);
                    cR = CANVAS.node.get.row(t); //get current control characters row
                    cL = CANVAS.node.get.left(t); //get current control characters left
                    if((r==cR) && (l==cL)) t.remove(); //if it matches our element get rid of it
                });

            },
            appendToInnermostChild: function(row, elem) {
                stickyLeft = CANVAS.node.get.left(stickycursor);
                controls = row.find(".control.x" + stickyLeft);
                console.log(controls.length);
                elem.attr("id", "cc" + ccCount);
                ccCount++;
                if(controls.length==0) {
                    //there are no controls that clash with us anyway so just append our control here
                    row.append(elem);
                    return false;
                } else {
                    //append our new control to the youngest control
                    parentControl = controls.find(':only-child:last').parent();
                    //elem.css("left", blockX + "px").addClass("xx" + stickyLeft);

                    //the 'left' we give our new cc is either a blocks width as it is next to another block
                    //or a calculated left if it is not next to another block
                    if($(".xx" + (stickyLeft-blockX)).length>0) {
                       //we are next to a cc
                       ccLeft = blockX;
                    } else {
                        //we're not next to a xx
                        //Find the closest cc
                        //any to the right?
                        var rightElem, leftElem;
                        for(a=(stickyLeft+blockX); a<canvasWidth; a=a+blockX) {
                            if($(".xx" + a).length>0) {
                                //found one!
                                rightElem = $(".xx" + a);
                                break;
                             }
                        }
                        
                        //any to the left?
                        for(a=stickyLeft; a>0; a=a-blockX) {
                            if($(".xx" + a).length>0) {
                                //found one!
                                leftElem = $(".xx" + a);
                                break;
                            }
                        }
                        console.log(leftElem, rightElem);
                        elem.css("left",ccLeft);
                    }  
                    parentControl.append(elem);
                    ccCount++;
                }
            },
            getCCWidth: function(cc) {
                //set width of control div
                //first get an array of all of the controls in this row
                var ccLeft = CANVAS.node.get.left(cc);
                var ccArr = cc.parents("div.row").find('div.control');
                var count=0;
                ccArr.each(function() {
                    //loop through all of the controllers in this row
                    if(CANVAS.node.get.left($(this))==ccLeft) return false;
                    count++;
                });
                if(count==(ccArr.length)) return (canvasWidth-ccLeft); 

                //if our control character is the last in the row
                //Make it fill the rest of the canvas
            },
            addCC: function(o) {
                if(stickycursor.length<1) return false; //no sticky cursor - get outta here!

                //if we're at the right hand side, also get outta here!
                if(CANVAS.node.at.right(o.elem)) return false;

                //remove any control character at this position
                CANVAS.node.cc.removeCCHere(stickycursor);

                palette = TT2COLOR[o.elem.attr("class").toUpperCase()]; //this is our colour

                id = o.elem.parent().attr("id"); //this is the description of our tool

                cls = "control " + o.elem.attr("class"); //this is the color
                cls += (id=="backgroundcolor") ? " background" : " foreground"; //is it background or foreground color
                cls += (id.indexOf("graphics")>-1) ? " graphics" : ""; //is it for graphics?
                
                w =CANVAS.node.cc.getCCWidth(stickycursor);
                style = stickycursor.attr("style") + "; width: " + w + "px";
                 
                cls += CANVAS.grid.getColumnClasses(CANVAS.node.get.left(stickycursor), w);

                ccWrapper = $('<div class="' + cls + '" style="' + style + '">');
                cc = $("<span>").text(palette.sname);

                ccWrapper.append(cc);

                CANVAS.node.cc.appendToInnermostChild(stickycursor.parents("div.row"), ccWrapper);

                CANVAS.node.move.right(stickycursor);

                return false;
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

