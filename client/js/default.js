$(document).ready(function () {
    ELEMS = {
        canvas: $("#canvas"),
        tools: $("#tools")
    }

    TOOLS.build();
    CANVAS.build();
});

var ELEMS = { }

var FUNCTIONS = {
    getPxInt: function(i) {
        /* **********
         * return an integer from EG 20px
         ********** */
        if(i==undefined) return 0;
        i = parseInt(i.substring(0, (i.length-2)));
        if(i.isNaN) i=0;
        return i;
    }
}

var TOOLS = {

    build: function() {

        //setup basic tool containers
        toolset = $('<div class="toolset"><ul/></div>');

        //add title and IDs to container
        bgTools = toolset.clone().attr("id","bg").prepend('<h2>BG</h2>');
        fgToolsG = toolset.clone().attr("id","fgg").prepend('<h2>FG graphics</h2>');
        fgToolsT = toolset.clone().attr("id","fgt").prepend('<h2>FG text</h2>');

        //loop through all colors
        for(i in TT2COLOR) {
            //add an LI with the class being the colors short name
            li = $("<li>").addClass(TT2COLOR[i].sname);

            //add a link
            a = $('<a href="#">').click(function() {
                TOOLS.functions.toolClick($(this));
            });

            //build our full element
            elem = li.append(a);

            //add these to our UL
            bgTools.find("ul").append(elem.clone({withDataAndEvents:true}));
            fgToolsG.find("ul").append(elem.clone({withDataAndEvents:true}));
            fgToolsT.find("ul").append(elem.clone({withDataAndEvents:true}));
        }

        for(i in $(fgToolsG).find("li")) {
            fgClass = fgToolsT.find("li").eq(i).attr("class");
            $(fgToolsG).find("li").eq(i).attr("class","f_" + fgClass);
            $(fgToolsT).find("li").eq(i).attr("class","f_" + fgClass);
            $(bgTools).find("li").eq(i).attr("class","b_" + fgClass);
        }
        //add the toolboxes to the tools area #tools
        ELEMS.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("li.f_BK").remove();
    },
    functions: {
        toolClick: function(t) {
            //select the LI
            t = t.parent();

            //a click can also unselect a tool
            var unSelecting;
            if(t.hasClass("selected")) {
                t.removeClass("selected");
                unSelecting = true;
            }

            toolset = t.parents("div.toolset");
            type = toolset.attr("id");

            //was a background button pressed? 
            if(type=="bg") {
                $("#bg li").removeClass("selected");
            } else {
                //if a foreground button was pressed, remove the selected
                //class from both the graphics and text buttons (as you cant have both)
                $("#fgg li, #fgt li").removeClass("selected");
            }

            if(!unSelecting) t.addClass("selected");

            //work out what classes will be added to our marquee
            ELEMS.toolClasses = "";
            $("#tools li.selected").each(function() {
                li = $(this);
                liType = li.parents("div.toolset").attr("id");
                liClass = li.attr("class").replace("selected","");
                if(liType=="fgg") ELEMS.toolClasses += "graphics";
                if((liType=="fgg") || (liType=="fgt")) ELEMS.toolClasses += (" foreground " + liClass);
                if(liType=="bg") ELEMS.toolClasses += (" background " + liClass);
            })

            $(".marquee.selected").attr("class","").addClass(ELEMS.toolClasses).addClass("marquee marqueeHeight selected");
            //check for changes in control character area
            CANVAS.marquee.checkEdges();
            CANVAS.marquee.CCArea($(".marquee.selected"));
            $(".marquee.selected .marquee-text").focus();

        }
    }
}

var CANVAS = {
    build: function() {
        CANVAS.grid.build();
        $("#canvas").prepend(
            $('<div id="marquee-layer"/>').
                css({
                    height: TT2CONSTANTS.CANVASHEIGHT + "px",
                    width: TT2CONSTANTS.CANVASWIDTH + "px"
                })
            )
    },
    grid: {
        build: function() {
            //set our table container
            table = $('<table>').attr({
                border: 0,
                id: "grid",
                cellspacing: 0,
                cellpadding: 0
            });

            for(row=1; row<=TT2CONSTANTS.LINES; row++) {
                //add a TR
                table.append($('<tr>').attr("id", ("row" + row)));
                for(col=1; col<=TT2CONSTANTS.COLUMNS; col++) {
                    //add TDs
                    td = $('<td>')
                        .addClass("col" + col)
                        .click(function() {
                            CANVAS.marquee.add($(this));
                            $(".marquee textarea").focus();
                        });
                    table.find("tr#row" + row).append(td);
                }
            }

            //add our table to the canvas
            ELEMS.canvas.append(table);
        },
        getPos: function(elem, type) {
            //get clicked areas column by parsing the class of
            //the TD that was clicked
            eClass = elem.attr("class");

            //extract the number from the classname
            col = parseInt(eClass.substring(3,eClass.length))-1;

            l = (col * TT2CONSTANTS.BLOCKX);

            //get row data from TR id
            rowId = elem.parent().attr("id");

            //extract the number from the id
            row = parseInt(rowId.substring(3,rowId.length)) -1;

            t = (row * TT2CONSTANTS.BLOCKY);

            if(type=="css") {
                return {
                    left: l + "px",
                    top: t + "px"
                }
            } else {
                return [l, t];
            }
        }
    },
    marquee: {
        add: function(elem) {

            /* **********
             * add a marquee to the canvas
             ********** */

            //remove any previous marquees
            $(".marquee").remove();

            //shared options for draggable and resizable
            opts = {
                grid: [TT2CONSTANTS.BLOCKX, TT2CONSTANTS.BLOCKY],
                containment: 'parent',
                snap: true,
                stop: function(event, ui) {
                    //CANVAS.marquee.markGrid();
                    CANVAS.marquee.checkEdges();
                    CANVAS.marquee.CCArea($(".marquee.selected"));
                    console.log(event.type);
                    if(event.type=="resizestop") CANVAS.marquee.setHeights($(this).height(), true);
                }
            }

            //get styles for marquee including its position and size
            css = $.extend(CANVAS.grid.getPos(elem, "css"), CANVAS.marquee.getInitialSize(elem));

            marquee = $('<div class="marquee marqueeHeight">')
                .css(css)
                .resizable(opts)
                .draggable(opts)
                .addClass(ELEMS.toolClasses)
                .append('<table class="marqueeHeight"><tr><td class="control-left">&nbsp;</td><td class="action"><div class="marquee-text marqueeHeight" contenteditable="true"></div></td><td class="control-right">&nbsp;</td></tr></table>')
                .append('<div class="marquee-helper marqueeHeight"/>')
                .focus(function() {
                    $(".marquee").removeClass("selected");
                    $(this).addClass("selected");
                 })
                 .blur(function() {
                    $(this).removeClass("selected");
                 });


            ELEMS.canvas.append(marquee);
            $(".marquee-text").fresheditor();
            $(".marquee-text").fresheditor("edit",true);

            //if anything in the marquee is selected, mark the marquee as selected
            $(".marquee").find("*").focus(function() {
                $(this).parents(".marquee").trigger("focus");
            });
            CANVAS.marquee.checkEdges();
            CANVAS.marquee.CCArea(marquee.find(".selected"));
            //CANVAS.marquee.markGrid();
            marquee.find(".marquee-text").focus()
        },
        setHeights: function(eHeight, setMarqueeText) {
            //set all related marquee containers to this new height
            //first round up the height to the nearest row
            eHeight = (Math.round(eHeight/TT2CONSTANTS.BLOCKY)*TT2CONSTANTS.BLOCKY);

            //now set all of the containers with 'marqueeHeight' to our new height
            $(".marquee.selected").height(eHeight).find(".marqueeHeight:not('.marquee-text')").height(eHeight);
            if(setMarqueeText) $(".marquee.selected").find(".marquee-text").height(eHeight);
        },
        CCArea: function(elem) {

           /* **********
            * Work out how much space the control characters will take up visually
            ********** */

            rows = (elem.height()/TT2CONSTANTS.BLOCKY);

            leftCC = elem.find(".control-left");
            rightCC = elem.find(".control-right");
            hasFg = elem.hasClass("foreground");
            hasBg = elem.hasClass("background");

            //white text on a black background is the default
            //so we kind of dont need control characters for this
            whiteFgLeftEdge = elem.is(".foreground.leftEdge.f_W");
            blackBgLeftEdge = elem.is(".background.leftEdge.b_BK");
            blackBgNotLeftEdge = (elem.is(".background._bBK") && !elem.hasClass("leftEdge"));
            rightEdge = elem.is(".rightEdge");
            notRightEdgeNotBgBlack = elem.is(".background:not(.rightEdge, .b_BK)");

            //console.log("hasFg:" + hasFg + " hasBg:" + hasBg + " whiteFgLeftEdge:" + whiteFgLeftEdge + " blackBgLeftEdge:" + blackBgLeftEdge + " blackBgNotLeftEdge:" + blackBgNotLeftEdge + " rightEdge:" + rightEdge + " notRightEdgeNotBgBlack:" + notRightEdgeNotBgBlack);


            cc1 = (TT2CONSTANTS.BLOCKX) + "px";
            cc2 = (TT2CONSTANTS.BLOCKX *2) + "px";
            cc3 = (TT2CONSTANTS.BLOCKX *3) + "px";

            //set defaults
            display = "none";
            displayRight = "table-cell";
            width = cc3;
            widthRight = cc1;

            if(hasFg && !hasBg) {

                //only forground
                
                //however if we're at the left edge and the silly user has
                //chosen white there is no need for a control character
                
                display = (whiteFgLeftEdge) ? "none" : "table-cell";
                width = cc1;

            } else if(!hasFg && hasBg) {

                //only background

                if(blackBgNotLeftEdge) {
                    //black not on left edge, only requires 1 cc
                    width = cc1;
                    display = "table-cell";
                } else if(blackBgLeftEdge) {
                    display = "none";
                } else {
                    //else its another color, needs 2 ccs
                    width = cc2;
                    display = "table-cell";
                }

            } else if(hasFg && hasBg) {

                //both background and foreground

                display = "table-cell";
                width = (TT2CONSTANTS.BLOCKX * 3) + "px";

                if(whiteFgLeftEdge && blackBgLeftEdge) {

                    //silly user has just chosen default colours & is at the left edge, show no left gutter
                    display = "none";

                } else if(whiteFgLeftEdge && !blackBgLeftEdge) {

                    //user has chosen default foreground color but a colored background & is on the left edge
                    width = cc2;
                    display = "table-cell";

                } else if(!whiteFgLeftEdge && blackBgLeftEdge) {
                    
                    //user has chosen a black BG but a colored foreground & is on the left edge
                    width = cc1;
                    display = "table-cell";

                } else if(blackBgNotLeftEdge) {
                    
                    //user is not on the left edge but has chosen black BG this only requires one CC for background
                    width = cc2;
                    display = "table-cell";
                        
                }

            }

            if(rightEdge || !notRightEdgeNotBgBlack) {

                //if we're at the right or background color is black no need for
                //CCs at the right
                displayRight = "none";

            }

            leftCC.css({
                display: display,
                width: width
            });

            rightCC.css({
                display: displayRight,
                width: widthRight
            });

            var oldHeight;

            $(".action").css("width", (elem.width()-((displayRight=="none") ? 0 : FUNCTIONS.getPxInt(widthRight))-((display=="none") ? 0 : FUNCTIONS.getPxInt(width))));
            $(".action .marquee-text")
                .attr({style: $(".action").attr("style"), spellcheck: false})
                .keydown(function(e) {
                    //round this height up to the grid
                    oldHeight = $(this).height();
                })
                .keyup(function(e) {
                    newHeight = $(this).height();
                    //has the keypress caused a change in height?
                    if(oldHeight != newHeight) CANVAS.marquee.setHeights(newHeight,false);
                });

        },
        markGrid: function(event, ui) {

           /* **********
            * For marking cells on the grid based on the position of the marquee
            ********** */

            //firstly remove previous overlap markers
            $("#grid td").removeClass("overlapping");

            //now mark overlapping TDs
            $(".marquee").collision("#grid td").addClass("overlapping");
        },
        checkEdges: function() {
            
            /* **********
             * check if we are on the left or right edge
             * as this determines control characters
             ********** */

            elem = $(".marquee.selected");
            left = FUNCTIONS.getPxInt(elem.css("left"));
            width = $(".marquee").width();

            //are we at the left edge?
            if(left==0) {
                elem.addClass("leftEdge");
            } else {
                elem.removeClass("leftEdge");
            }

            //are we at the right edge?
            if((left + width)==TT2CONSTANTS.CANVASWIDTH) {
                elem.addClass("rightEdge");
            } else {
                elem.removeClass("rightEdge");
            }
        },
        getInitialSize: function(elem) {

            /* **********
             * get initial size of a marquee, make sure it doesnt
             * go outside the boundaries of the canvas
             ********** */

            pos = CANVAS.grid.getPos(elem, "array"); 
            left = pos[0];
            topp = pos[1];

            //preferred height
            height = (TT2CONSTANTS.BLOCKY * 3);
        
            //if the width or height will go outside the bounds of the canvas make it smaller
            //default width is fullwidth
            width = TT2CONSTANTS.CANVASWIDTH-left;
            height = ((topp + height) > TT2CONSTANTS.CANVASHEIGHT) ? (TT2CONSTANTS.CANVASHEIGHT-topp) : height;

            return {
                height: height + "px",
                width: width + "px"
            }
        }
    }
}

Array.min = function( array ){
    return Math.min.apply( Math, array );
};

