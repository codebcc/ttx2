
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
                td = CELL.getCell({row:data.pos.firstRow,col:MARQUEE.firstColOffset()});
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
            if(EL.cursor.data().pos) {
                var curData = EL.cursor.data().pos.data();
                var nextCell = CELL.getCell({row:curData.row,col:(curData.col+1)});
                var nextCellPos = CELL.getPos(nextCell);
            }

            CANVAS.loop({

                marquee: true,
                firstCol: o.insert ? nextCellPos.col : MARQUEE.firstColOffset(),
                firstRow: o.insert ? nextCellPos.row : EL.curMarquee.data().pos.firstRow,
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

                        } else if((chars[charPos]==32) || ((charPos==0) && o.insert)) { //space!
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
            if(o.insert) EDIT.cursor.init(EL.cursor.data().pos);

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

                tdData = td.data();

                if(td.hasClass("cc")) {

                    col = tdData.color ? COLORS[tdData.color].sname : "";
                    if(tdData.background=="background") DATA.rowData.background = col;
                    if(tdData.foreground=="foreground") DATA.rowData.foreground = "f-" + col;
                    if(tdData.graphics=="graphics") DATA.rowData.foregroundType = "graphics";
                    if(tdData.text=="text") DATA.rowData.foregroundType = "text";

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
    },
    getEditableArea: function(o) {

        if(!o) o = {};
        cmData = (EL.curMarquee && !o.ignoreMarquee) ? EL.curMarquee.data().pos : undefined;

        return {
            firstCol: cmData ? (o.fullMarquee ? cmData.firstCol: MARQUEE.firstColOffset()) : 1,
            lastCol: cmData ? cmData.lastCol : DATA.cols,
            firstRow: cmData ? cmData.firstRow : 1,
            lastRow: cmData ? cmData.lastRow : DATA.rows
       }
    }
}
