
var TOOLS = {

    _build: function() {
        
        for(i in TOOLSETS) {
            
            toolset = TOOLSETS[i];
            if (toolset.contents) {

                $("#tools").append(
                    $('<div class="group"/>')
                        .attr("id",toolset.id)
                        .append(toolset.title ? $('<h2>' + toolset.title + '</h2>') : "")
                );

                wrapper = $("#tools #" + toolset.id);

                for(j in toolset.contents) {
                    TOOLS.buildToolset(toolset.contents[j], wrapper);
                }

            } else {
                TOOLS.buildToolset(toolset);   
            }
        }
    },

    buildToolset: function(toolset,wrapper) {

        if(!wrapper) wrapper = $("#tools");

        wrapper.append(
            $('<div class="toolset"/>')
                .append(toolset.title ? '<h3>' + toolset.title + '</h3>' : "")
                .data(toolset.data)
         );

         TOOLS.buildTool.init({
             toolset: toolset,
             wrapper: wrapper
         });
        
    },

    buildColors: function(t) {

        var $ul = $("<ul/>");


        for(i in COLORS) {
            //add an LI with the class being the colors short name
            
            if(t.id.indexOf("text")>-1) {
                ccPrefix = "t_";
            } else if(t.id.indexOf("graphics")>-1) {
                ccPrefix = "g_";
            } else {
                ccPrefix = "b_";
            }


            $li = $("<li>")
                .data({
                    color: COLORS[i].name.toLowerCase(),
                    cc: ccPrefix + COLORS[i].sname
                })
                .addClass(COLORS[i].sname)


            //add a link
            $a = $('<a href="#">').click(function() {
                TOOLS.toolClick($(this));
                return false;
            });

            //build our full element
            $ul.append($li.append($a));
            
        }

        return $ul;
        
    },

    buildTool: {

        init: function(o) {

            if(o.toolset.buildFunction) {

                console.log(o.toolset.buildFunction());

                o.wrapper.append(o.toolset.buildFunction());

            } else {

                tool = o.toolset.type ? o.toolset.type : "button";
                TOOLS.buildTool[tool](o);

            }
            
        },

        button: function(o) {

            o.wrapper.append(
                $('<input type="button"/>')
                    .change(function() {
                        if(o.changeFunction) o.changeFunction;
                    })
                    .val(o.toolset.title)
                    .attr("class",o.toolset.title)
            )            

        },

        checkbox: function() {
            
        }
        
    },
    build: function() {

        toolset = $('<div class="toolset"><ul/></div>');

        //add title and IDs to container
        bgTools = toolset.clone().data("background","background").addClass("background").prepend('<h2>BG</h2>');
        fgToolsG = toolset.clone().data({foreground: "foreground", graphics: "graphics"}).prepend('<h2>FG graphics</h2>');
        fgToolsT = toolset.clone().data({foreground: "foreground", text: "text"}).prepend('<h2>FG text</h2>');

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
                $(fgToolsG).find("li").eq(i).attr({"class":fgClass}).data("cc","g_" + fgClass.toLowerCase());
                $(fgToolsT).find("li").eq(i).attr({"class":fgClass}).data("cc", "t_" + fgClass.toLowerCase());
                $(bgTools).find("li").eq(i).attr({"class":fgClass}).data("cc", "b_" + fgClass.toLowerCase());
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

        drawing = $('<div class="toolset" class="drawing" />')
            .append('<h2>Drawing</h2>').end()
            .append('<ul/>')
                .append('<li/>')
                    .append('<a href="#" id="pen">Pen</a>')
                    .click(EDIT.drawing.init());
        $("div.toolset:last-child").after(drawing);
        
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

        if(!EL.curMarquee) {
            FN.help("No marquee selected!");
            return false;
        }
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
        MARQUEE.activate();
        if(EL.curMarquee.data().charArr && (EL.curMarquee.data().charArr.length>0)) MARQUEE.editMode.drawText();

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
                                } else {
                                    EDIT.tdClick($(this));
                                }
                                //EDIT.cursor.init(t);
                            })
                            .dblclick(function() {
                                EDIT.tdDblClick($(this));
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
                filter: "td,tr",
                cancel: "td.ui-selected, #canvas.edit td"
            });

    },
    keys: function() {

        //Marquee mode
        
        $(document).jkey('backspace,delete', function() {

            
            if($("div.marquee.edit").length<1) {

                tdSel = $("#grid td.ui-selected");
                MARQUEE.savePreviousSelection();
                if(tdSel.length>0) {
                    CC.removeSelected();
                    EL.curMarquee.addClass("empty");
                    MARQUEE.removeEmpties();
                    MARQUEE.setTDClasses({previousMarquee:true});
                    MARQUEE.editMode.removeText();
                    tdSel.removeClass("ui-selected");
                }

            }

        });


    },
    loop: function(opts) {

        //loop through specified cells and perform a function
        settings = {};

        if((EL.curMarquee.length>0) && (!EL.curMarquee.hasClass("empty"))) opts.marquee = true;

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
        
        if(settings.inclusive) var endCol = settings.lastCol;


        for(i=settings.firstRow;i<=settings.lastRow;i++) {

            tr = $("#row" + i);

            if(settings.inclusive) {
               if((i>settings.firstRow) && (i<settings.lastRow)) {
                   settings.firstCol = MARQUEE.firstColOffset();
                   settings.lastCol = posData.lastCol;
               }
               if(i==settings.firstRow) {
                    settings.lastCol = posData.lastCol; 
               }
               if((i==settings.lastRow) && (!settings.until)) {
                    settings.lastCol = endCol; 
                    if(settings.lastRow!=settings.firstRow) settings.firstCol = MARQUEE.firstColOffset();
               }
            }


            if(settings.trFunction) settings.trFunction(tr,i)

            for(j=settings.firstCol;j<=settings.lastCol;j++) {

                if(settings.until) if(settings.until()) {
                    return td;
                    break;
                }

                td = CELL.getCell({row:i,col:j,ignoreMarquee:true});

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
            EL.curMarquee.removeClass("empty");

        },

        cancel: function() {
            $("#canvas div.edit").removeClass("edit");
            $("#canvas").toggleClass("edit");
            EL.curToolbar.hide();
            EDIT.cursor.remove();
            DATA.editMode = false;
            if(EL.curMarquee.find("span.t").length<1) EL.curMarquee.addClass("empty");
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
                td = CELL.getCell({row:data.pos.firstRow,col:(data.pos.firstCol + MARQUEE.toolOffset())});
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

                tdFunction: function(td) {

                    span = td.find("span.t");
                    special = td.find("span.s");

                    if(span.length>0) text += ((special.length>0) ? span.text() : span.text().charCodeAt()) + ";";

                }
            });

            EL.curMarquee.data("text",text);
        },

        drawText: function(o) {

            if(!o) o = {};

            t = o.insert ? DATA.clipboard.insert : EL.curMarquee.data("text");

            if(!t) return false;

            var chars = t.split(";");
            chars.push("32"); //add a space to the end to help wrapping
            var charPos = lineCount = rowFirstChar = 0;
            var hold = false;

            CANVAS.loop({

                marquee: true,
                firstCol: o.insert ? EL.cursor.parent().data().col : MARQUEE.firstColOffset(),
                firstRow: o.insert ? EL.cursor.parent().data().row : EL.curMarquee.data().pos.firstRow,
                inclusive: o.insert,
                    
                trFunction: function(tr) {
                    //check if this word will fit
                    if(hold) {
                        hold = false;
                        charPos++;
                    }
                    
                    rowFirstChar = charPos;
                },


                tdFunction: function(td) {

                    if(charPos<chars.length) {
                        if(chars[charPos]==13) { //newline

                            hold=true;
                            td.append(EDIT.textSpan(13, "special"));

                        } else if(chars[charPos]==32) { //space!
                            //dont start a line with a space
                            if(td.data("col")==MARQUEE.firstColOffset()) charPos++;

                            //wrap words that are too long to fit on this line
                            nextSpace = chars.indexOf("32",(charPos+1));
                            if((td.data("col")+(nextSpace-charPos)-1)>EL.curMarquee.data().pos.lastCol) hold=true;

                        }
                        if(!hold) {
                            td.append(EDIT.textSpan(String.fromCharCode(chars[charPos])));
                            charPos++;
                        }
                    }

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
                    //revert to original size if collision was detected
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
                //remove overflowing text
                if(ui.originalSize) if(ui.originalSize.height<EL.curMarquee.height()) MARQUEE.editMode.removeText();
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

        if(!marquee) marquee = EL.curMarquee;

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
    },
    firstColOffset: function() {
        if(!EL.curMarquee.data()) return false;
        return (MARQUEE.toolOffset() + EL.curMarquee.data().pos.firstCol);
    }
}
