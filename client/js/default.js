$(document).ready(function () {
    EL = $.extend(EL, {
        canvas: $("#canvas"),
        tools: $("#tools")
    });
    DATA.FN.getPostLoadData();
    TOOLS.build();
    CANVAS.build();
    CANVAS.keys();
});

var DATA = {
	cols: 40,
	rows: 25,
    blockX: 16,
    blockY: 20,
    textBoxCount: 1,
    marqueeCount: 0,
    chars: " `1234567890-=qwertyuiop[]\asdfghjkl;'zxcvbnm''./ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    $cells: {},
    $rows: {},
    ccAttrs: ["background","color","foreground","text","graphics","new"],
    FN: {
        getPostLoadData: function() {
            DATA = $.extend(DATA, {
                tdAttrs: FN.getTDAttrs(),
                canvasHeight: (DATA.blockY *  DATA.cols),
                canvasWidth: (DATA.blockX * DATA.rows)
            });

        }
    }
}

var EL = {}

var TOOLS = {

    build: function() {

        toolset = $('<div class="toolset"><ul/></div>');

        //add title and IDs to container
        bgTools = toolset.clone().data("background","background").addClass("background").prepend('<h2>BG</h2>');
        fgToolsG = toolset.clone().data({foreground: "foreground", graphics: "graphics"}).addClass("graphics foreground").prepend('<h2>FG graphics</h2>');
        fgToolsT = toolset.clone().data({foreground: "foreground", text: "text"}).addClass("text foreground").prepend('<h2>FG text</h2>');

        //loop through all colors
        for(i in COLORS) {
            //add an LI with the class being the colors short name
            li = $("<li>").data("color",COLORS[i].name.toLowerCase()).addClass(COLORS[i].sname);

            //add a link
            a = $('<a href="#">').click(function() {
                TOOLS.toolClick($(this));
                return false;
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
        EL.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("div.toolset[foreground] li.BK").remove();

        //add other tools
        //preview
        preview = $('<div class="toolset"/>')
            .append($('<input type="checkbox"/>')
                .change(function() {
                    EL.canvas.toggleClass("preview");
                })
            )
            .append($('<span/>').text("Preview"));
        $("div.toolset:last-child").after(preview);

    },
    setTools: function(tools) {

        //set tools back to a previous configuration

        TOOLS.reset();

        for(i in tools) {
            t = tools[i];
            if(t.background) {
                tsClass = "background";
            } else if (t.graphics) {
                tsClass = "graphics";
            } else if (t.text) {
                tsClass = "text";
            } else {
                tsClass = "";
            }
            par = (tsClass=="") ? $("#tools") : $("#tools div." + tsClass);

            if(t.color) par.find("li." + t.color.sname).addClass("selected");
        }
    },
    reset: function() {
        EL.tools.find("li.selected").removeClass("selected");
    },
    toolClick: function(t) {

        //what type of tool was clicked?
        
        toolset = t.parents("div.toolset");
        li = t.parent();

        foreground = toolset.data("foreground");
        background = toolset.data("background");

        //mark selection of tools in the toolbar
        if(li.hasClass("selected")) {
            //we're just deselecting a tool
            li.removeClass("selected"); 
        } else {
            //we're selecting a new tool
            //only one foreground tool can be selected at a time
            if(foreground) EL.tools.find("div.toolset.foreground li.selected").removeClass("selected");

            if(background) toolset.find("li.selected").removeClass("selected");
            li.addClass("selected");
        }

        tdSelected = $("#grid td.ui-selected");

        //add control characters to the grid
        if(tdSelected.length>0) CC.init();

        EL.curMarquee.data('tools',DATA.tools);


        MARQUEE.setTDClasses({marquee:true});

    }
}

var CANVAS = {

    build: function() {
        //first build our grid        
        EL.grid = $('<table id="grid" class="grid"/>');
        for(i=1; i<=DATA.rows; i++) {
            EL.grid
                .append(
                    $('<tr>')
                        .attr({
                            id: ("row" + i)
                        })
                        .data("row",i)
                );

            for(j =1; j<= DATA.cols; j++) {
                EL.grid.find("tr#row" + i)
                    .append(
                        $('<td>')
                            .attr({
                                id: ("cell" + i + "_" + j)
                            })
                            .data({
                                row: i,
                                col: j
                            })
                            .click(function() {
                                t = $(this);
                                if(!t.data("marquee")) {
                                    MARQUEE.editMode.cancel();
                                    MARQUEE.deactivate();
                                }
                                EDIT.cursor.init(t);
                            })
                    );
                DATA.$cells["cell" + i + "_" + j] = EL.grid.find("#cell" + i + "_" + j);
            }
        }
        EL.canvas
            .append(EL.grid)
            .after($('<div id="help"/>'));

        EL.grid
            .selectable({
                stop: function(e,ui) {
                    sel = $("#grid td.ui-selected");
                    if(sel.length==1) {
                        MARQUEE.deactivate();
                        EDIT.cursor.init(sel);
                        return false;
                    }
                    coll = $("#grid td.collide");
                    if(coll.length>0) {
                        $("#grid td").removeClass("collide ui-selected");
                        MARQUEE.activate($("#marquee" + DATA.marqueeCount));
                    } else {
                        EDIT.cursor.remove();
                        MARQUEE.init();
                        FN.help("");
                    }
                },
                start: function() {
                    MARQUEE.removeEmpties();
                },
                selecting: function(e,ui) {
                    s = $(ui.selecting);
                    MARQUEE.markCollisions($(ui.selecting), $("div.marquee"));
                },
                unselecting: function(e,ui) {
                    u = $(ui.unselecting);
                    MARQUEE.unMarkCollisions($(ui.unselecting), $("div.marquee"));
                },
                filter: "td",
                cancel: "td.ui-selected, #canvas.edit td"
            });

    },
    keys: function() {

        //Marquee mode
        
        $(document).jkey('backspace', function() {

            
            if($("div.marquee.edit").length<1) {

                tdSel = $("#grid td.ui-selected");
                MARQUEE.savePreviousSelection();
                if(tdSel.length>0) {
                    CC.removeSelected();
                    EL.curMarquee.addClass("empty");
                    MARQUEE.removeEmpties();
                    MARQUEE.setTDClasses({previousMarquee:true});
                    tdSel.removeClass("ui-selected");
                }

            } else {

                
            }


        });


    },
    loop: function(opts) {

        //loop through specified cells and perform a function
        settings = {};

        if(opts.marquee) {

            posData = EL.curMarquee.data().pos;

            $.extend(settings, {
                lastRow: posData.lastRow,
                firstRow: posData.firstRow,
                firstCol: posData.firstCol,
                lastCol: posData.lastCol
            }, opts);

        } else {

            $.extend(settings, {
                lastRow: DATA.rows,
                firstRow: 1,
                lastCol: DATA.lastCol,
                firstCol: DATA.firstCol 
            }, opts);

        }
       
        if(settings.fullWidth) {
            settings.firstCol = 1;
            settings.lastCol = DATA.cols;
        }
        
        for(i=settings.firstRow;i<=settings.lastRow;i++) {

            tr = $("#row" + i);

            if(settings.trFunction) settings.trFunction(tr,i)

            for(j=settings.firstCol;j<=settings.lastCol;j++) {

                td = FN.getCell(i,j);
                if(settings.tdFunction) settings.tdFunction(td,j);

            }

        }
    }
}

var MARQUEE = {

    init: function() {

        DATA.marqueeCount++;

        MARQUEE.removeEmpties();

        TOOLS.reset();

        attrs = MARQUEE.getSelectedAttrs();

        EL.canvas
            .append(
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
                    .data({
                        id         : DATA.marqueeCount,
                        editMode   : {
                        },
                        text       : "",
                        pos         : {
                            firstCol    : firstCol,
                            lastCol     : lastCol,
                            firstRow    : firstRow,
                            lastRow     : lastRow
                        }

                    })
            )
            .append(
                $('<div class="toolbar" id="toolbar' + DATA.marqueeCount + '"/>')
                    .css({
                        height  : "20px",
                        left    : attrs.left,
                        top     : attrs.topp-20
                    })
                    .append(
                        $('<a href="#"/>')
                            .text("Cancel edit mode")
                            .click(function() {
                                MARQUEE.editMode.cancel();
                                return false;
                            })
                    )
            );

        MARQUEE.activate($("#marquee" + DATA.marqueeCount));

        MARQUEE.makeDynamic(EL.curMarquee);

        MARQUEE.setBorder();


    },
    editMode: {

        init: function() {

            EL.curMarquee.toggleClass("edit");
            $("#canvas").toggleClass("edit");

            EL.curToolbar = $("div#toolbar" + EL.curMarquee.data("id"));
            EL.curToolbar.show();
            DATA.editMode = true;
            MARQUEE.editMode.setCursorPosition();

        },

        cancel: function() {
            $("#canvas div.edit").removeClass("edit");
            $("#canvas").toggleClass("edit");
            EL.curToolbar.hide();
            EDIT.cursor.remove();
            DATA.editMode = false;
            MARQUEE.editMode.storeTextData();
        },

        repositionToolbar: function() {
            EL.curToolbar.css({
                top: FN.getPxInt(EL.curMarquee.css("top"))-20,
                left: EL.curMarquee.css("left")
            })
        },

        setCursorPosition: function() {
            data = EL.curMarquee.data();
            if(!data.editMode.cursorPos) {
                td = FN.getCell(data.pos.firstRow,(data.pos.firstCol + MARQUEE.toolOffset()));
            }
            if(DATA.editMode) {
                EDIT.cursor.init(td);
            } else {
                return td;
            }
        },

        storeTextData: function() {

            if($("#grid td.ui-selected span.t").length==0) return false;

            var text = "";

            CANVAS.loop({
                marquee: true,
                trFunction: function(tr) {

                    //add a return character if it's not the first row
                    if(tr.data().row>EL.curMarquee.data().pos.firstRow) text+="13;"
                },

                tdFunction: function(td) {

                    span = td.find("span.t");
                    if(span.length>0) text+= span.text().charCodeAt() + ";";                     

                }
            });

            EL.curMarquee.data("text",text);
        },

        drawText: function() {

            t = EL.curMarquee.data("text");
            if(!t) return false;

            var textLines = t.split("13;");

            var chars = [];
            var charCount = lineCount = 0;

            CANVAS.loop({

                marquee: true,
                firstCol: (EL.curMarquee.data().pos.firstCol + MARQUEE.toolOffset()),
                lastRow: (textLines.length+EL.curMarquee.data().pos.firstRow-1),
                    
                trFunction: function(tr) {
                    chars = (textLines[lineCount]) ? textLines[lineCount].split(";") : "";
                    charCount=0;
                    lineCount++;
                },

                tdFunction: function(td) {
                                    
                    if(charCount<chars.length) {
                        td.append(EDIT.textSpan(String.fromCharCode(chars[charCount])));
                    }

                    charCount++;

                }
            });

        },

        removeText: function(tds) {
            tds = (!tds) ? $("#grid td.ui-selected") : tds;
            tds.find("span.t").remove();
        }

    },
    setTDClasses: function(o) {

        CANVAS.loop($.extend({
            fullWidth: true, 
            trFunction: function() {

                DATA.rowData = {};
                DATA.cls = "";

            },
            tdFunction: function(td) {

                if(td.hasClass("cc")) {

                    col = td.data("color") ? COLORS[td.data("color")].sname : "";
                    if(td.data("background")=="background") DATA.rowData.background = col;
                    if(td.data("foreground")=="foreground") DATA.rowData.foreground = "f-" + col;
                    if(td.data("graphics")=="graphics") DATA.rowData.foregroundType = "graphics";
                    if(td.data("text")=="text") DATA.rowData.foregroundType = "text";

                    if(DATA.rowData.background) DATA.cls = DATA.rowData.background + " ";
                    if(DATA.rowData.foreground) DATA.cls += DATA.rowData.foreground + " ";
                    if(DATA.rowData.foregroundType) DATA.cls += DATA.rowData.foregroundType;

                } else {
                    DATA.newCCGroup = false;

                    cd = td.data("classes");
                    cd = cd ? cd : "";
                    classes = cd + " " + $.trim(DATA.cls);
                    td
                        .removeClass(classes)
                        .addClass($.trim(DATA.cls))
                        .data("classes",$.trim(DATA.cls));

                }
            }
        },o));

                
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
                if(e.type=="resizestop") {
                    if(EL.curMarquee.hasClass("collide")) {
                        EL.curMarquee
                            .css({
                                height: ui.originalSize.height,     
                                width: ui.originalSize.width
                            })
                            .removeClass("collide");

                        MARQUEE.setBorder();
                        FN.help("");
                        return false;
                    } 
                }
                MARQUEE.editMode.removeText(DATA.previousSelection);
                CC.removeSelected(DATA.previousSelection);
                MARQUEE.markSelectedBlocks();
                MARQUEE.updatePosition(); //because snapping is buggy :(
                CC.init();
                rr = MARQUEE.getEventRowRange();
                MARQUEE.setTDClasses(rr);
                MARQUEE.editMode.drawText();
                MARQUEE.editMode.repositionToolbar();
            },
            start: function(e,ui) {
                MARQUEE.savePreviousSelection();
            },
            containment: EL.canvas
        };

        dragOpts = {};
        resizeOpts = {};

        $.extend(resizeOpts, opts, {
            resize: function(e,ui) {
                elem = $(ui.element);
                MARQUEE.moveFN();
                MARQUEE.markCollisions(EL.curMarquee, $("div.marquee:not(.selected)"));
            }
        });

        $.extend(dragOpts, opts, {
            drag: function() {
                MARQUEE.moveFN();
            },
            delay: 100,
            obstacle: ".marquee:not(.selected)", 
            preventCollision: true
        });


        elem.click(function() {
            t = $(this);
            MARQUEE.activate(t);
        })
        .dblclick(function() {
            MARQUEE.editMode.init();
        })
        .resizable(resizeOpts)
        .draggable(dragOpts)
        .append('<div class="border"/>')

    },
    activate: function(marquee) {

        if($("div.edit").length>0) MARQUEE.editMode.cancel();

        MARQUEE.deactivate();

        marquee
            .addClass("selected")
            .resizable("enable")
            .draggable("enable");

        EL.curMarquee = marquee;
        EL.curToolbar = $("div#toolbar" + EL.curMarquee.data("id"));
        MARQUEE.markSelectedBlocks();
        tools = marquee.data("tools");
        if(tools)TOOLS.setTools(tools);
    },
    deactivate: function() {
        if(EL.curMarquee) {
            EL.curMarquee
                .removeClass("selected")
                .resizable("disable")
                .draggable("disable");

            EL.curMarquee = undefined;
        }
    },
    updatePosition: function() {
        attrs = MARQUEE.getSelectedAttrs();
        EL.curMarquee
            .css({
                top: attrs.topp,
                left: attrs.left,
                width: attrs.width,
                height: attrs.height            
            })
            .data({
                pos: {
                    firstCol: firstCol,
                    lastCol: lastCol,
                    firstRow: firstRow,
                    lastRow: lastRow
                }
            })
                        
    },
    getEventRowRange: function() {
        cData = EL.curMarquee.data().pos;
        pData = DATA.previousAttrs;
        firstRow = (cData.firstRow<=pData.firstRow) ? cData.firstRow : pData.firstRow;
        lastRow = (cData.lastRow>=pData.lastRow) ? cData.lastRow : pData.lastRow;

        return {
            firstRow: firstRow,
            lastRow: lastRow
        }

    },
    moveFN: function() {

        MARQUEE.setBorder();

    },
    removeEmpties: function() {

        empties = $("div.marquee.empty");

        if(empties.length>0) {
            empties.remove();
        }

    },
    setBorder: function() {
        EL.curMarquee.find("div.border").height(EL.curMarquee.height()-2);
    },
    markSelectedBlocks: function() {
        EL.curMarquee
            .removeData("jqueryCollisionCoordinates")
            .removeData("jqueryUiDraggableCollisionRecentPosition");

        $("#grid td.ui-selected").removeClass("ui-selected")
        hits = EL.curMarquee.collision(EL.grid.find("td"));
        hits.addClass("ui-selected").data("marquee",EL.curMarquee.data("id"));
    },
    savePreviousSelection: function() {
        DATA.previousSelection = $("#grid td.ui-selected");
        DATA.previousAttrs = MARQUEE.getSelectedAttrs();
    },
    getSelectedAttrs: function() {

        firstCol = parseInt($("#grid td.ui-selected:first").data("col"));
        lastCol = parseInt($("#grid td.ui-selected:last").data("col"));
        firstRow = parseInt($("#grid td.ui-selected:first").data("row"));
        lastRow = parseInt($("#grid td.ui-selected:last").data("row"));

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

    },
    markCollisions: function(collider, obstacle) {
        hits = obstacle.collision(collider);
        collider = (collider.hasClass("marquee")) ? EL.curMarquee : collider;
        if(hits.length>0) {
            collider.addClass("collide");
            FN.help("Marquees must not overlap!");
        } else {
            collider.removeClass("collide");
        }
    },
    unMarkCollisions: function(collider, obstacle) {
        hits = obstacle.collision(collider);
        if(hits.length!=0) {
            hits.removeClass("collide");
        } else {
            FN.help("");
        }
    },
    toolOffset: function() {
        cmd = EL.curMarquee.data();
        if(!cmd) return 0;
        return (cmd.tools) ? cmd.tools.length : 0;
    }
}

var CC = {

    init: function() {

        //*** Determine what control characters are required

        //make an array of selected tools
        
        selectedTools = $("#tools li.selected");

        var tools = []; //will hold data about our selected tools
        DATA.ccArr = new Array(); //array of control characters

        if(selectedTools.length==0) {

            DATA.tools = [];
            CC.addToGrid();
            return false;            
        }

        DATA.blackBGLeftEdge = false; //black BG at left edge has no control character
        DATA.blackBGNotLeftEdge = false; //black BG not at left edge has one less control character
        DATA.whiteTextLeftEdge = false; //white text at left edge has no control character

        DATA.atLeftEdge = CC.checkLeftEdge(); //are we at the left edge?

        selectedTools.each(function(i) {
            t = $(this);
            toolset = t.parents("div.toolset");
            tools[i] = {
                background:     toolset.data("background"),
                foreground:     toolset.data("foreground"),
                text:           toolset.data("text"),
                graphics:       toolset.data("graphics"),
                color:          t.data("color") ? COLORS[t.data("color")] : false,
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
        if(FN.getCSSInt("width",EL.curMarquee) < (ccLen*DATA.blockX)) {
            FN.help("Marquee too small");
        } else {
            FN.help("");
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
        return ($("#grid td#cell1_1.ui-selected").length>0);
    },
    addToGrid: function() {

        EL.curMarquee.removeClass("empty");

        cr = FN.getCellsRange($("#grid td.ui-selected"));

        //delete any CCs covered by this selection
        CC.removeSelected();

        atRightEdge = ($("#grid td.col40.ui-selected").length>0);

        //add CCs to the grid
        for(i = cr.firstRow; i<=cr.lastRow; i++) {

            for(j in DATA.ccArr) {

                j = parseInt(j);

                //add CC data to the grid
                thisCol = FN.getCell(i,(cr.firstCol+j));

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
            .addClass("cc")
            .find("span.cc").remove().end()
            .append(CC.addCC(cc))
            .data((toolObj) ? CC.addData(toolObj) : "")

    },
    addData: function(tool) {
        if(tool==undefined) return {};
        color = (tool.color) ? tool.color.name.toLowerCase() : "";
        return {
            color: color,
            background: tool.background,
            foreground: tool.foreground,
            graphics: tool.graphics,
            text: tool.text,
            new: tool.new,
            marquee: EL.curMarquee.data("id")
        }

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
            col = t.data("col");
            cls = "ui-selectee ui-selected";
            t
                .attr("class",cls)
                .data({
                    color: "",
                    background: "",
                    foreground: "",
                    graphics: "",
                    text: "",
                    marquee: "",
                    new: ""
                })
                .find("span.cc").remove()

        });
    }
}

var FN = {
    getCell: function(row,col) {
        return DATA.$cells["cell" + row + "_" + col];
    },
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
            firstRow: parseInt(hits.eq(0).data("row")),
            lastRow: parseInt(hits.eq(hits.length-1).data("row")),
            firstCol: parseInt(hits.eq(0).data("col")),
            lastCol: parseInt(hits.eq(hits.length-1).data("col")),
        }
    },
    getTDAttrs: function() {
        tdA = new Array();
        for(i in COLORS) {
            tdA.push(COLORS[i].sname);
            tdA.push("f-" + COLORS[i].sname);
        }
        tdA.push("graphics");
        tdA.push("text");
        return tdA;
    }
}

var EDIT = {

    cursor: {

        init: function(td) {
            EDIT.cursor.remove();
            td.append(
                $('<div id="cursor"/>').data("pos",td)
            )
            EL.cursor = $("#cursor");
            EDIT.keys.init();
        },

        remove: function() {
            $("#cursor").remove();
        },

        move: {

            forward: function() {

                if(EL.curMarquee) marqueeData = EL.curMarquee.data();
                marqueeEdit = (EL.curMarquee) ? EL.curMarquee.hasClass("edit") : false;
                lastCol = marqueeEdit ? marqueeData.pos.lastCol : DATA.cols;
                firstCol = marqueeEdit ? (marqueeData.pos.firstCol + MARQUEE.toolOffset()) : 1;

                curData = EL.cursor.data("pos").data();
                nextRow = (curData.col<lastCol) ? (curData.row) : ((curData.row<DATA.rows) ? (curData.row+1) : curData.row);
                nextCol = (curData.col<lastCol) ? (curData.col+1) : ((curData.row<DATA.rows) ? firstCol : (curData.col));
                nextCell = FN.getCell(nextRow,nextCol);

                EDIT.cursor.remove();

                EDIT.cursor.init(nextCell);

            }

        },

        newLine: function() {}


    },
    keys: {
        
        init: function() {

            if($(document).data("events").keypress) return false;

            $(document).keypress(function(e) {

                key = (String.fromCharCode(e.charCode));

                if(e.charCode==13) {

                    EDIT.cursor.newLine();

                } else if(DATA.chars.indexOf(key)>-1) {
                    ch = EDIT.textSpan(key);
                    td = EL.cursor.data("pos");
                    td.find("span.t").remove();
                    td.append(ch); 
                    EDIT.cursor.move.forward();
                }

                return false;
            });

        },

        cancel: function() {

            $(document).unbind("keypress");

        }

    },

    addTextData: function(key) {

        t = EL.curMarquee.data("text");
        EL.curMarquee.data("text", (t+key));

    },

    textSpan: function(key) {

        return $('<span class="t"/>').text(key);

    }


}
