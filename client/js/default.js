$(document).ready(function () {
    DATA = $.extend(DATA, {
        elems: {
            canvas: $("#canvas"),
            tools: $("#tools"),
        },
        tdAttrs: FUNCTIONS.getTDAttrs()
    });

    TOOLS.build();
    CANVAS.build();

    $(document).jkey('backspace', function() {
        tdSel = $("#grid td.ui-selected");
        if(tdSel.length>0) {
            CC.removeSelected();
            DATA.elems.curMarquee.addClass("empty");
            MARQUEE.removeEmpties();
            MARQUEE.setTDClasses(FUNCTIONS.getCellsRange(tdSel), "clear");
            tdSel.removeClass("ui-selected");
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
    ccAttrs: ["background","color","foreground","text","graphics","new"]
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
    reset: function() {
        DATA.elems.tools.find("li.selected").removeClass("selected");
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

        tdSelected = $("#grid td.ui-selected");

        MARQUEE.setTDClasses(FUNCTIONS.getCellsRange(tdSelected), "clear");

        //add control characters to the grid
        if(tdSelected.length>0) CC.init();

        MARQUEE.setTDClasses(FUNCTIONS.getCellsRange(tdSelected), "add");
        //console.log(FUNCTIONS.getCellsRange(tdSelected));
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
                selecting: function(e,ui) {
                    td = $(ui.selecting);
                    hits = $("div.marquee").collision(td) 
                    if(hits.length>0) td.addClass("collide");
                },
                unselecting: function(e,ui) {
                    td = $(ui.unselecting);
                    td.removeClass("collide");
                },
                stop: function(e) {
                    MARQUEE.removeEmpties();
                    //dont make a selection if marquee selection overlaps another marquee
                    coll = $("#grid td.collide");
                    if(coll.length>0) {
                        FUNCTIONS.help("Marquees must not overlap");
                        coll.removeClass("collide");
                        $("#grid td.ui-selected").removeClass("ui-selected");
                    } else {
                        FUNCTIONS.help("");
                        MARQUEE.init();
                    }
                },
                filter: "td",
                cancel: "td.ui-selected"
            });

    }
}

var MARQUEE = {

    init: function() {

        MARQUEE.removeEmpties();

        TOOLS.reset();

        if(DATA.elems.curMarquee) DATA.elems.curMarquee.removeClass("selected");

        attrs = MARQUEE.getSelectedAttrs();

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
        );


        
        DATA.elems.curMarquee = $("div.marquee.selected");

        MARQUEE.makeDynamic(DATA.elems.curMarquee);

        MARQUEE.setBorder();

        DATA.marqueeCount++;

    },
    setTDClasses: function(range,type) {
        for(i=range.firstRow;i<=range.lastRow;i++) {
            tr = $("#grid tr.row" + i);
            cls = "";
            tr.find("td").each(function() {
                t = $(this);
                if(t.hasClass("cc")) {
                    if(!DATA.newCCGroup) cls="";
                    DATA.newCCGroup = true;
                    //this is a control character, what does it do?
                    if(t.attr("background")=="background") cls += COLORS[t.attr("color")].sname + " ";
                    if(t.attr("foreground")=="foreground") cls += "f-" + COLORS[t.attr("color")].sname + " ";
                    if(t.attr("graphics")=="graphics") cls += " graphics ";
                } else {
                    if(type=="clear") {
                        for(j in DATA.tdAttrs) {
                            t.removeClass(DATA.tdAttrs[j]);
                        }
                    } else {
                        DATA.newCCGroup = false;
                        t.addClass(cls);
                    }
                }
            });
        }    
    },
    makeDynamic: function(elem) {

        opts = {
            grid: [
                DATA.blockX,
                DATA.blockY
            ],
            minWidth: (DATA.blockX *4),
            zIndex: 50,
            stop: function(e,ui) {
                console.log(ui,e);
                MARQUEE.removePreviousSelection();
                MARQUEE.markSelectedBlocks();
                MARQUEE.alignToGrid(); //because snapping is buggy :(
                CC.init();
                MARQUEE.setTDClasses(FUNCTIONS.getCellsRange($(ui.helper[0])), "add");
            },
            start: function(e,ui) {
                MARQUEE.setTDClasses(FUNCTIONS.getCellsRange($(ui.helper[0])), "clear");
            },
           containment: DATA.elems.canvas,
        };

        dragOpts = {};
        resizeOpts = {};

        $.extend(resizeOpts, opts, {
            resize: function() {
                MARQUEE.moveFunctions();
            }
        });

        $.extend(dragOpts, opts, {
            drag: function() {
                MARQUEE.moveFunctions();
            },
            delay: 250,
            obstacle: ".marquee:not(.selected)", 
            preventCollision: true
        });


        elem.click(function() {
            t = $(this);
            if(!t.hasClass("selected")) {
                MARQUEE.removeEmpties();
                DATA.elems.curMarquee.removeClass("selected");
                $(this).addClass("selected");
                DATA.elems.curMarquee = $("div.marquee.selected");
            }
        })
        .resizable(resizeOpts)
        .draggable(dragOpts)
        .append('<div class="border"/>')

    },
    alignToGrid: function() {
        attrs = MARQUEE.getSelectedAttrs();
        DATA.elems.curMarquee.css({
            top: attrs.topp,
            left: attrs.left,
            width: attrs.width,
            height: attrs.height            
        });
                        
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
        DATA.elems.curMarquee
            .removeData("jqueryCollisionCoordinates")
            .removeData("jqueryUiDraggableCollisionRecentPosition");
        $("#grid td.ui-selected").removeClass("ui-selected");
        hits = DATA.elems.curMarquee.collision($("#grid td.col")) 
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


        //first determine if a background tool was used that needs a special 'new background' tool
        for(i in tools) {
            if(tools[i].background && !DATA.blackBGLeftEdge) {
                arrStart = tools.slice(0,(i+1));
                arrStart.push({new: "new", cc: ccs["b_n"]});
                arrEnd = tools.slice((i+1),tools.length);
                tools = arrStart.concat(arrEnd); 
            }
        }

        //determine what CCs are needed
        for(i in tools) {
            tool = tools[i];
            if(tool.foreground) CC.addFG(tool);
            if(tool.background) CC.addBG(tool);
            if(tool.new) CC.addNewBG(tool);
        }

        DATA.tools = tools;

        //check marquee is big enough to hold the CCs
        ccLen = DATA.ccArr.length;
        if(FUNCTIONS.getCSSInt("width",DATA.elems.curMarquee) < (ccLen*DATA.blockX)) {
            FUNCTIONS.help("Marquee too small");
        } else {
            FUNCTIONS.help("");
            //add our CCs to the grid
            if(tools.length>0) CC.addToGrid();
        }

    },
    addBG: function(tool) {
        //background is a text color CC followed by a new background CC
        if(!DATA.blackBGLeftEdge) {
            //a background color is a foreground color followed by a 'new background' character
            if(!DATA.blackBGNotLeftEdge) DATA.ccArr.push(tool.cc); //specifiy BG color if it's not black
        }
    },
    addNewBG: function(tool) {
        DATA.ccArr.push(tool.cc);
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

        cr = FUNCTIONS.getCellsRange($("#grid td.ui-selected"));

        //delete any CCs covered by this selection
        CC.removeSelected();

        atRightEdge = ($("#grid td.col40.ui-selected").length>0);

        //add CCs to the grid
        for(i = cr.firstRow; i<=cr.lastRow; i++) {
            for(j in DATA.ccArr) {
                j = parseInt(j);

                //add CC data to the grid
                thisCol = $("#grid tr.row" + i + " td.col" + (cr.firstCol + j));
                CC.addCCTD(thisCol, DATA.tools[j], DATA.ccArr[j]);
            }
        }

    },
    addNewBg: function(td) {
        CC.addCCTD(td, {background: "background", color: COLORS["black"], new: "new"}, ccs["b_bk"]);
    },
    addCCTD: function(td, toolObj, cc) {

        if(toolObj==undefined) return false;
        td
            .addClass("cc ")
            .append(CC.addCC(cc))
            .attr((toolObj) ? CC.addAttributes(toolObj) : "")
    },
    addAttributes: function(tool) {
        if(tool==undefined) return {};
        color = (tool.color) ? tool.color.name.toLowerCase() : "";
        return {
            color: color,
            background: tool.background,
            foreground: tool.foreground,
            graphics: tool.graphics,
            text: tool.text,
            new: tool.new,
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
                    "class":cls,
                    marquee: "",
                    new: ""
                })
                .find("span.cc").remove()

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
    },
    roundToRow: function(x) {
        return Math.round(x / DATA.blockY)*DATA.blockY;
    },
    roundToCol: function(x) {
        return Math.round(x / DATA.blockX)*DATA.blockX;
    },
    getCellsRange: function(elem) {
        //return the rows covered by element or elements
        if(elem.hasClass("ui-selected")) {
            hits = elem;
        } else {
            hits = elem.collision($("#grid td")); 
        }
        return {
            firstRow: parseInt(hits.eq(0).attr("row")),
            lastRow: parseInt(hits.eq(hits.length-1).attr("row")),
            firstCol: parseInt(hits.eq(0).attr("col")),
            lastCol: parseInt(hits.eq(hits.length-1).attr("col")),
        }
    },
    getTDAttrs: function() {
        tdA = new Array();
        for(i in COLORS) {
            tdA.push(COLORS[i].sname);
            tdA.push("f-" + COLORS[i].sname);
        }
        tdA.push("graphics");
        return tdA;
    }
}


