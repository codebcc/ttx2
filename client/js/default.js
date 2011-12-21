$(document).ready(function () {

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
                elems: {
                    canvas: $("#canvas"),
                    tools: $("#tools"),
                },
                tdAttrs: FN.getTDAttrs(),
                canvasHeight: (DATA.blockY *  DATA.cols),
                canvasWidth: (DATA.blockX * DATA.rows)
            });

        }
    }
}

var TOOLS = {

    build: function() {

        //setup basic tool containers
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
        DATA.elems.tools.append(bgTools, fgToolsG, fgToolsT);

        //remove black from the foreground buttons as it wasn't a feature
        // in classic teletext (who knew!?)
        $("div.toolset[foreground] li.BK").remove();

        //add other tools
        //preview
        preview = $('<div class="toolset"/>')
            .append($('<input type="checkbox"/>')
                .change(function() {
                    DATA.elems.canvas.toggleClass("preview");
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
        DATA.elems.tools.find("li.selected").removeClass("selected");
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
            if(foreground) $("#tools").find("div.toolset.foreground li.selected").removeClass("selected");

            if(background) toolset.find("li.selected").removeClass("selected");
            li.addClass("selected");
        }

        tdSelected = $("#grid td.ui-selected");

        //add control characters to the grid
        if(tdSelected.length>0) CC.init();

        DATA.elems.curMarquee.data('tools',DATA.tools);

        MARQUEE.setTDClasses("add");

    }
}

var CANVAS = {

    build: function() {
        //first build our grid        
        DATA.elems.grid = $('<table id="grid" class="grid"/>');
        for(i=1; i<=DATA.rows; i++) {
            DATA.elems.grid
                .append(
                    $('<tr>')
                        .attr({
                            id: ("row" + i)
                        })
                        .data("row",i)
                );

            for(j =1; j<= DATA.cols; j++) {
                DATA.elems.grid.find("tr#row" + i)
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
                DATA.$cells["cell" + i + "_" + j] = DATA.elems.grid.find("#cell" + i + "_" + j);
            }
        }
        DATA.elems.canvas
            .append(DATA.elems.grid)
            .after($('<div id="help"/>'));

        $("#grid")
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
                if(tdSel.length>0) {
                    CC.removeSelected();
                    DATA.elems.curMarquee.addClass("empty");
                    MARQUEE.removeEmpties();
                    MARQUEE.setTDClasses("clear");
                    tdSel.removeClass("ui-selected");
                }

            } else {

                
            }


        });


    },
    loop: function(opts) {

        //loop through specified cells and perform a function
        
        if(opts.marquee) posData = DATA.elems.curMarquee.data().pos;

        settings = {
            lastRow: (opts.marquee) ? posData.lastRow : DATA.rows,
            lastCol: (opts.marquee) ? posData.lastCol : DATA.cols,
            firstCol: (opts.marquee) ? posData.firstCol : 1,
            firstRow: (opts.marquee) ? posData.firstRow : 1
        }
        
        $.extend(settings, opts);
        
        for(i=settings.firstRow;i<=settings.lastRow;i++) {

            tr = $("tr#row" + i);

            if(settings.trFunction) settings.trFunction(tr);

            for(j=settings.firstCol;j<=settings.lastCol;j++) {

                td = FN.getCell(i,j);
                if(settings.tdFunction) settings.tdFunction(td);

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

        DATA.elems.canvas
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

        MARQUEE.makeDynamic(DATA.elems.curMarquee);

        MARQUEE.setBorder();


    },
    editMode: {

        init: function() {

            DATA.elems.curMarquee.toggleClass("edit");
            $("#canvas").toggleClass("edit");

            DATA.elems.curToolbar = $("div#toolbar" + DATA.elems.curMarquee.data("id"));
            DATA.elems.curToolbar.show();
            DATA.editMode = true;
            MARQUEE.editMode.setCursorPosition();

        },

        cancel: function() {
            $("#canvas div.edit").removeClass("edit");
            $("#canvas").toggleClass("edit");
            DATA.elems.curToolbar.hide();
            EDIT.cursor.remove();
            DATA.editMode = false;
            MARQUEE.editMode.storeTextData();
        },

        repositionToolbar: function() {
            DATA.elems.curToolbar.css({
                top: FN.getPxInt(DATA.elems.curMarquee.css("top"))-20,
                left: DATA.elems.curMarquee.css("left")
            })
        },

        setCursorPosition: function() {
            data = DATA.elems.curMarquee.data();
            if(!data.editMode.cursorPos) {
                td = FN.getCell(data.pos.firstRow,(data.pos.firstCol + ((data.tools) ? data.tools.length : 0)));
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
                    if(tr.data().row>DATA.elems.curMarquee.data().pos.firstRow) text+="13;"
                },

                tdFunction: function(td) {

                    span = td.find("span.t");
                    if(span.length>0) text+= span.text().charCodeAt() + ";";                     

                }
            });

            DATA.elems.curMarquee.data("text",text);
        },

        drawText: function() {

            cm = DATA.elems.curMarquee;
            t = cm.data("text");

            CANVAS.loop({
                marquee: true,

                tdFunction: function(td) {

                    //td.append

                }
            });

        }

    },
    setTDClasses: function(type) {

        DATA.type=type;

        CANVAS.loop({
            
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
        });
                
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
                    if(DATA.elems.curMarquee.hasClass("collide")) {
                        DATA.elems.curMarquee
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

                CC.removeSelected(DATA.previousSelection);
                MARQUEE.markSelectedBlocks();
                MARQUEE.updatePosition(); //because snapping is buggy :(
                CC.init();
                MARQUEE.setTDClasses("add");
                MARQUEE.editMode.repositionToolbar();
            },
            start: function(e,ui) {
                MARQUEE.savePreviousSelection();
            },
            containment: DATA.elems.canvas
        };

        dragOpts = {};
        resizeOpts = {};

        $.extend(resizeOpts, opts, {
            resize: function(e,ui) {
                elem = $(ui.element);
                MARQUEE.moveFN();
                MARQUEE.markCollisions(DATA.elems.curMarquee, $("div.marquee:not(.selected)"));
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

        DATA.elems.curMarquee = marquee;
        DATA.elems.curToolbar = $("div#toolbar" + DATA.elems.curMarquee.data("id"));
        MARQUEE.markSelectedBlocks();
        tools = marquee.data("tools");
        if(tools)TOOLS.setTools(tools);
    },
    deactivate: function() {
        if(DATA.elems.curMarquee) {
            DATA.elems.curMarquee
                .removeClass("selected")
                .resizable("disable")
                .draggable("disable");

            DATA.elems.curMarquee = undefined;
        }
    },
    updatePosition: function() {
        attrs = MARQUEE.getSelectedAttrs();
        DATA.elems.curMarquee
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
        DATA.elems.curMarquee.find("div.border").height(DATA.elems.curMarquee.height()-2);
    },
    markSelectedBlocks: function() {
        DATA.elems.curMarquee
            .removeData("jqueryCollisionCoordinates")
            .removeData("jqueryUiDraggableCollisionRecentPosition");
        $("#grid td.ui-selected").removeClass("ui-selected");
        hits = DATA.elems.curMarquee.collision($("#grid td")) 
        hits.addClass("ui-selected").data("marquee",DATA.elems.curMarquee.data("id"));
    },
    savePreviousSelection: function() {
        DATA.previousSelection = $("#grid td.ui-selected");
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
        collider = (collider.hasClass("marquee")) ? DATA.elems.curMarquee : collider;
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
        if(FN.getCSSInt("width",DATA.elems.curMarquee) < (ccLen*DATA.blockX)) {
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

        DATA.elems.curMarquee.removeClass("empty");

        cr = FN.getCellsRange($("#grid td.ui-selected"));

        //delete any CCs covered by this selection
        //CC.removeSelected();

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
            marquee: DATA.elems.curMarquee.data("id")
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
            DATA.elems.cursor = $("#cursor");
            EDIT.keys.init();
        },

        remove: function() {
            $("#cursor").remove();
        },

        move: {

            forward: function() {

                if(DATA.elems.curMarquee) marqueeData = DATA.elems.curMarquee.data();
                marqueeEdit = (DATA.elems.curMarquee) ? DATA.elems.curMarquee.hasClass("edit") : false;
                lastCol = marqueeEdit ? marqueeData.pos.lastCol : DATA.cols;
                firstCol = marqueeEdit ? (marqueeData.pos.firstCol + (marqueeData.tools ? marqueeData.tools.length : 0)) : 1;

                curData = DATA.elems.cursor.data("pos").data();
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
                    td = DATA.elems.cursor.data("pos");
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

        t = DATA.elems.curMarquee.data("text");
        DATA.elems.curMarquee.data("text", (t+key));

    },

    textSpan: function(key) {

        return $('<span class="t"/>').text(key);

    }


}
