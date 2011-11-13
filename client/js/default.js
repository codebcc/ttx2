$(document).ready(function () {
    ELEMS = {
        canvas: $("#canvas"),
        tools: $("#tools")
    }

    TOOLS.build();
    CANVAS.build();
});

var ELEMS = { }

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

        //add the toolboxes to the tools area #tools
        ELEMS.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("#fgg li.BK, #fgt li.BK").remove();
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
                if((liType=="fgg") || (liType=="fgt")) ELEMS.toolClasses += (" foreground f" + liClass);
                if(liType=="bg") ELEMS.toolClasses += (" background " + liClass);
            })

            console.log(ELEMS.toolClasses);

            $("#marquee").attr("class","").addClass(ELEMS.toolClasses); 

        }
    }
}

var CANVAS = {
    build: function() {
        CANVAS.grid.build();
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
            $("#marquee").remove();

            //shared options for draggable and resizable
            opts = {
                grid: [TT2CONSTANTS.BLOCKX, TT2CONSTANTS.BLOCKY],
                containment: 'parent',
                snap: true,
                stop: function(event, ui) {
                    CANVAS.marquee.markGrid();
                }
            }

            //get styles for marquee including its position and size
            css = $.extend(CANVAS.grid.getPos(elem, "css"), CANVAS.marquee.getInitialSize(elem));

            marquee = $('<div id="marquee">')
                .css(css)
                .resizable(opts)
                .draggable(opts)
                .append('<table id="marquee-inner"><tr><td id="control">&nbsp;</td><td id="action">&nbsp;</td></tr></table>');

            ELEMS.marquee = marquee;
            ELEMS.canvas.append(ELEMS.marquee);
            CANVAS.marquee.markGrid();
        },
        markGrid: function(event, ui) {

           /* **********
            * For marking cells on the grid based on the position of the marquee
            ********** */

            //firstly remove previous overlap markers
            $("#grid td").removeClass("overlapping");

            //now mark overlapping TDs
            $("#marquee").collision("#grid td").addClass("overlapping");
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

