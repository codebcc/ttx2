$(document).ready(function () {
    DATA = $.extend(DATA, {
        elems: {
            canvas: $("#canvas"),
            tools: $("#tools"),
        }
    });

    TOOLS.build();
    CANVAS.build();

    $(document).jkey('backspace', function() {
        if($("#grid td.ui-selected").length>0) {
            CC.removeSelected();
            DATA.elems.curMarquee.addClass("empty");
            MARQUEE.removeEmpties();
        }
    });

});

var DATA = {
	cols: 40,
	rows: 25,
    blockX: 16,
    blockY: 20,
    textBoxCount: 1,
    marqueeCount: 1,
    ccAttrs: ["background","color","foreground","text","graphics"]
}

DATA = $.extend(DATA, {
    canvasHeight: (DATA.blockY *  DATA.cols),
    canvasWidth: (DATA.blockX * DATA.rows)
});


var TOOLS = {

    build: function() {

        //setup basic tool containers
        toolset = $('<div class="toolset"><ul/></div>');

        //add title and IDs to container
        bgTools = toolset.clone().attr("background","background").prepend('<h2>BG</h2>');
        fgToolsG = toolset.clone().attr({foreground: "foreground", graphics: "graphics"}).prepend('<h2>FG graphics</h2>');
        fgToolsT = toolset.clone().attr({foreground: "foreground", text: "text"}).prepend('<h2>FG text</h2>');

        //loop through all colors
        for(i in COLORS) {
            //add an LI with the class being the colors short name
            li = $("<li>").attr("color",COLORS[i].name.toLowerCase()).addClass(COLORS[i].sname);

            //add a link
            a = $('<a href="#">').click(function() {
                TOOLS.toolClick($(this));
            });

            //build our full element
            elem = li.append(a);
            var liClone = function(toolset) {
                toolset.find("ul").append(elem.clone({withDataAndEvents:true}));
            }

            //add these to our UL
            liClone(bgTools);
            liClone(fgToolsG);
            liClone(fgToolsT);
        }

        for(i in $(fgToolsG).find("li")) {
            fgClass = fgToolsT.find("li").eq(i).attr("class");
            if(fgClass) {
                $(fgToolsG).find("li").eq(i).attr({"class":fgClass, cc: "g_" + fgClass.toLowerCase()});
                $(fgToolsT).find("li").eq(i).attr({"class":fgClass, cc: "t_" + fgClass.toLowerCase()});
                $(bgTools).find("li").eq(i).attr({"class":fgClass, cc: "b_" + fgClass.toLowerCase()});
            }
        }
        //add the toolboxes to the tools area #tools
        DATA.elems.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("div.toolset[foreground] li.BK").remove();

        //add other tools
        marqueeRadio = $('<label/>')
           .append(
                $('<input type="radio" name="marqueeType" value="multi" />')
           )
           .append(
                $('<span/>').text("Multi")
           );
        marqueeRadio2 = marqueeRadio.clone();

        marqueeRadio2.find("input").attr("value", "point").removeAttr("checked");

        marqueeRadio2.find("span").text("Point");

        marqueeType = $('<div class="toolset" id="marqueeType"/>')
            .append(marqueeRadio)
            .append(marqueeRadio2);

                
        DATA.elems.tools.append(marqueeType);
        DATA.elems.tools.find("div#marqueeType input[value='multi']").attr("checked",true);
    
    },
    toolClick: function(t) {

        //what type of tool was clicked?
        toolset = t.parents("div.toolset");
        li = t.parent();

        foreground = toolset.attr("foreground");
        background = toolset.attr("background");

        //mark selection of tools in the toolbar
        if(li.hasClass("selected")) {
            //we're just deselecting a tool
            li.removeClass("selected"); 
        } else {
            //we're selecting a new tool
            //only one foreground tool can be selected at a time
            if(foreground) $("#tools").find("div.toolset[foreground='foreground'] li.selected").removeClass("selected");

            if(background) toolset.find("li.selected").removeClass("selected");
            li.addClass("selected");
        }

        //add control characters to the grid
        if($("#grid td.ui-selected").length>0) CC.init();
    }
}

var CANVAS = {
    build: function() {
        //first build our psedu-grid        
        DATA.elems.grid = $('<table id="grid" class="grid"/>');
        for(i=1; i<=DATA.rows; i++) {
            DATA.elems.grid
                .append(
                    $('<tr>')
                        .attr({
                            "class": ("row" + i),
                            rel: i
                        })
                );

            for(j =1; j<= DATA.cols; j++) {
                DATA.elems.grid.find(".row" + i)
                    .append(
                        $('<td>')
                            .attr({
                                "class":("col col" + j),
                                col: j,
                                row: i
                            })
                    );
            }
        }
        DATA.elems.canvas
            .append(DATA.elems.grid)
            .after($('<div id="help"/>'));

        $("#grid")
            .selectable({
                stop: function(e) {
                    MARQUEE.init();
                },
                filter: "td"
            });

    }
}

var MARQUEE = {

    init: function() {

        MARQUEE.removeEmpties();

        if(DATA.elems.curMarquee) DATA.elems.curMarquee.removeClass("selected");

        attrs = MARQUEE.getSelectedAttrs();

        opts = {
            grid: [
                DATA.blockX,
                DATA.blockY
            ],
            minWidth: (DATA.blockX *3),
            zIndex: 50,
            stop: function() {
            },
           containment: DATA.elems.canvas,
        };

        resizeOpts = $.extend(opts, {
            resize: function() {
                MARQUEE.moveFunctions();
            },
            stop: function() {
                MARQUEE.removePreviousSelection();
                MARQUEE.markSelectedBlocks();
                CC.init();
            }
        });

        dragOpts = $.extend(opts, {
            drag: function() {
                MARQUEE.moveFunctions();
            },
            obstacle: ".marquee:not(.selected)", 
            preventCollision: true
        });

        DATA.elems.canvas.append(
            $("<div/>")
                .attr({
                    id          : "marquee" + DATA.marqueeCount,
                    "class"     : "marquee empty selected",
                    rel         : DATA.marqueeCount
                })
                .css({
                    height      : attrs.height,
                    left        : attrs.left,
                    position    : "absolute",
                    top         : attrs.topp,
                    width       : attrs.width
                })
                .click(function() {
                    t = $(this);
                    if(!t.hasClass("selected")) {
                        MARQUEE.removeEmpties();
                        DATA.elems.curMarquee.removeClass("selected");
                        $(this).addClass("selected");
                        DATA.elems.curMarquee = $("div.marquee.selected");
                        MARQUEE.markSelectedBlocks();
                    }
                })
                .resizable(resizeOpts)
                .draggable(dragOpts)
                .append('<div class="border"/>')
        )

        DATA.elems.curMarquee = $("div.marquee.selected");

        MARQUEE.setBorder();

        DATA.marqueeCount++;

    },
    getFloaterAttrs: function(marquee) {

        topp    = FUNCTIONS.getCSSInt("top",marquee);
        left    = FUNCTIONS.getCSSInt("left",marquee);
        width   = FUNCTIONS.getCSSInt("width",marquee);
        height  = FUNCTIONS.getCSSInt("height",marquee);
        bottom  = topp + height;
        right   = left + width;

        return {
            topp    : topp,
            left    : left,
            width   : width,
            height  : height,
            bottom  : bottom,
            right   : right
        }

    },
    moveFunctions: function() {

        MARQUEE.setBorder();

    },
    removeEmpties: function() {

        empties = $("div.marquee.empty");

        if(empties.length>0) {
            empties.remove();
            DATA.marqueeCount--;
        }

    },
    setBorder: function() {
        DATA.elems.curMarquee.find("div.border").height(DATA.elems.curMarquee.height()-2);
    },
    markSelectedBlocks: function() {
        $("td.ui-selected").removeClass("ui-selected");
        var hits = $("div.selected").eq(0).collision($("#grid td.col")) 
            console.log(hits.length);
        hits.addClass("ui-selected"); 
    },
    removePreviousSelection: function() {
        curId = DATA.elems.curMarquee.attr("rel");
        sels = $("#grid td[marquee='" + curId + "']");
        if(sels.length<1) return false;
        CC.removeSelected(sels);

    },
    getSelectedAttrs: function() {

        firstCol = parseInt($("#grid td.ui-selected:first").attr("col"));
        lastCol = parseInt($("#grid td.ui-selected:last").attr("col"));
        firstRow = parseInt($("#grid td.ui-selected:first").attr("row"));
        lastRow = parseInt($("#grid td.ui-selected:last").attr("row"));

        topp = ((firstRow-1) * DATA.blockY);
        left = ((firstCol-1) * DATA.blockX);
        width = ((lastCol+1) - firstCol) * DATA.blockX;
        height = ((lastRow+1) - firstRow) * DATA.blockY;
        bottom = topp + height;
        right = left + width;

        return {
            firstRow    : firstRow,
            lastRow     : lastRow,
            firstCol    : firstCol,
            lastCol     : lastCol,
            bottom      : bottom,
            right       : right,
            topp        : topp,
            left        : left,
            height      : height,
            width       : width
        }

    }
}

var CC = {

    init: function() {

        //*** Determine what control characters are required

        //make an array of selected tools
        
        selectedTools = $("#tools li.selected");

        var tools = []; //will hold data about our selected tools
        DATA.ccArr = new Array(); //array of control characters
        DATA.blackBGLeftEdge = false; //black BG at left edge has no control character
        DATA.blackBGNotLeftEdge = false; //black BG not at left edge has one less control character
        DATA.whiteTextLeftEdge = false; //white text at left edge has no control character

        DATA.atLeftEdge = CC.checkLeftEdge(); //are we at the left edge?

        selectedTools.each(function(i) {
            t = $(this);
            toolset = t.parents("div.toolset");
            tools[i] = {
                background:     toolset.attr("background"),
                foreground:     toolset.attr("foreground"),
                text:           toolset.attr("text"),
                graphics:       toolset.attr("graphics"),
                color:          t.attr("color") ? COLORS[t.attr("color")] : false,
                cc:             ccs[t.attr("cc")]
            }


            //the default text color is white and default background color is black so
            //we don't need control characters if these are selected AND we're at the left edge
            //
            //if black is the background color and we're not at the left edge we'll need one less control character

            if(DATA.atLeftEdge) {
                if(!DATA.whiteTextLeftEdge) DATA.whiteTextLeftEdge = (tools[i].text && (tools[i].color.name=="White"));
                if(!DATA.blackBGLeftEdge) DATA.blackBGLeftEdge = (tools[i].background && (tools[i].color.name=="Black"));
            }

            if(!DATA.blackBGNotLeftEdge) DATA.blackBGNotLeftEdge = (tools[i].background && (tools[i].color.name=="Black"));

        });

        //determine what CCs are needed
        for(i in tools) {
            tool = tools[i];
            if(tool.foreground) CC.addFG(tool);
            if(tool.background) CC.addBG(tool);
        }

        DATA.tools = tools;

        //add our CCs to the grid
        if(tools.length>0) CC.addToGrid();

    },
    addBG: function(tool) {
        //background is a text color CC followed by a new background CC
        if(!DATA.blackBGLeftEdge) {
            //ccArr[0] = ccs
            if(!DATA.blackBGNotLeftEdge) DATA.ccArr.push(tool.cc); //specifiy BG color if it's not black
            DATA.ccArr.push(ccs["b_n"]); //new background
        }
    },
    addFG: function(tool) {
        if(!DATA.whiteTextLeftEdge) DATA.ccArr.push(tool.cc);
    },
    checkLeftEdge: function() {
        //is our selection touching the left edge?
        return ($("#grid td.col1.ui-selected").length>0);
    },
    addToGrid: function() {

        DATA.elems.curMarquee.removeClass("empty");

        firstCol = parseInt($("#grid td.ui-selected:first").attr("col"));
        lastCol = parseInt($("#grid td.ui-selected:last").attr("col"));
        firstRow = parseInt($("#grid td.ui-selected:first").attr("row"));
        lastRow = parseInt($("#grid td.ui-selected:last").attr("row"));

        //delete any CCs covered by this selection
        CC.removeSelected();

        atRightEdge = ($("#grid td.col40.ui-selected").length>0);

        //add CCs to the grid
        var bg=false;
        for(i = firstRow; i<=lastRow; i++) {
            for(j in DATA.ccArr) {
                j = parseInt(j);
                //specify if a background has been set as this determines wether
                //new background characters are required for last column
                if(DATA.tools[j]) if(DATA.tools[j].background!=undefined) bg=true;

                //add CC data to the grid
                thisCol = $("#grid tr.row" + i + " td.col" + (firstCol + j));
                if(DATA.ccArr[j].title=="New Background") CC.addNewBg(thisCol);
                CC.addCCTD(thisCol, DATA.tools[j], DATA.ccArr[j]);
            }
        }

        //if we're not at the right edge add new background characters to last column
        if(!atRightEdge && bg) {
            td = $("#grid tr:lt(" + lastRow + "):gt(" + (firstRow-2) + ") td.col" + lastCol);
            CC.addNewBg(td);
        }

    },
    addNewBg: function(td) {
        CC.addCCTD(td, {background: "background", color: COLORS["black"]}, ccs["b_bk"]);
    },
    addCCTD: function(td, toolObj, cc) {
        //build classes
        if(toolObj==undefined) return false;
        cls="";
        for(j in DATA.ccAttrs) {
            ccAtt = DATA.ccAttrs[j];
            if(toolObj) {
                cls += (ccAtt=="color") ? toolObj.color.sname : toolObj[ccAtt];
                cls += " ";
            }
        } 
        td
            .addClass("cc " + cls)
            .append(CC.addCC(cc))
            .attr((toolObj) ? CC.addAttributes(toolObj) : "")
    },
    addAttributes: function(tool) {
        if(tool==undefined) return {};

        return {
            color: tool.color.name.toLowerCase(),
            background: tool.background,
            foreground: tool.foreground,
            graphics: tool.graphics,
            text: tool.text,
            marquee: DATA.elems.curMarquee.attr("rel")
        }

    },

    addTextBox: function(firstCol, lastCol, firstRow, lastRow) {
        //determine boundaries for the text box
    },
    addCC: function(ccData) {
        return $('<span>')
                .text(String.fromCharCode(parseInt(ccData.unicode.toLowerCase(), 16)))
                .attr({
                    "class": "cc"
                });
    },
    removeSelected: function(elems) {
        if(elems==undefined) elems=$("#grid td.ui-selected");
        elems.each(function() {
            t = $(this);
            col = t.attr("col");
            cls = "col col" + col + " ui-selectee ui-selected";
            t
                .attr({
                    color: "",
                    background: "",
                    foreground: "",
                    graphics: "",
                    text: "",
                    "class":cls
                })
                .find("span.cc").remove()

        });
    },
    addClasses: function() {
        //Yup. We're going to go through the whole grid and add classes to squares based on CCs
        var row, col;
        var cls = "";
        var attrObj = {};
        $("#grid td.cc").each(function() {
            cls = "";
            t = $(this);
            for(i in DATA.ccAttrs) {
               cls += " " + t.attr(DATA.ccAttrs[i]);
            }
            
            t.attr("class",(t.attr("class") + cls));
        });
    }
}

var FUNCTIONS = {
    getPxInt: function(i) {
        /* **********
         * return an integer from EG 20px
         ********** */
        if(i==undefined) return 0;
        i = parseInt(i.substring(0, (i.length-2)));
        if(i.isNaN) i=0;
        return i;
    },
    getCSSInt: function(css, elem) {
        return parseInt(elem.css(css));
    },
    help: function(txt) {
        $("#help").text(txt);
    }
}


