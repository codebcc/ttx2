
var MARQUEE = {

    init: function() {

        FN.help("");
        
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
                        charArr     : [],
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
            EDIT.cursor.placeAtLastChar();
            EL.curMarquee.removeClass("empty");

        },

        cancel: function() {
            $("#canvas div.edit").removeClass("edit");
            $("#canvas").toggleClass("edit");
            EL.curToolbar.hide();
            EDIT.cursor.remove();
            DATA.editMode = false;
            if(EL.curMarquee.find("span.t").length<1) EL.curMarquee.addClass("empty");
        },

        repositionToolbar: function() {
            EL.curToolbar.css({
                top: FN.getPxInt(EL.curMarquee.css("top"))-20,
                left: EL.curMarquee.css("left")
            })
        },

        drawText: function(o) {

            if(!o) o = {};

            var chars = EL.curMarquee.data().charArr;
            EL.curMarquee.data().charMap = {};

            if(!t) return false;

            $("#grid td.ui-selected span.t").remove();

            var charPos = rowFirstChar = 0;
            var hold = false;
            var curMarqueeData = EL.curMarquee.data().pos;

            if(EL.cursor && EL.cursor.data().pos) {
                var curData = EL.cursor.data().pos.data();
                var nextCell = CELL.getCell({row:curData.row,col:(curData.col+1)});
                var nextCellPos = CELL.getPos(nextCell);
            }

            CANVAS.loop({

                marquee: true,
                firstCol: MARQUEE.firstColOffset(),
                firstRow: curMarqueeData.firstRow,
                    
                trFunction: function(tr) {

                    if(hold) {
                        hold = false;
                        charPos++;
                    }
                    
                    rowFirstChar = charPos;
                },


                tdFunction: function(td) {

                    tdData = td.data();

                    if(charPos<chars.length) {

                        if(chars[charPos]==13) { //newline

                            if(!hold) {
                                td.append(EDIT.textSpan(13, "special"));
                                td.data().charPos = charPos;
                                EL.curMarquee.data().charMap[charPos] = td;
                            }
                            hold=true;

                        } else if(chars[charPos]==32) { //space!

                            if(!hold) {
                                EL.curMarquee.data().charMap[charPos] = td;
                                td.data().charPos = charPos;
                            }

                            //dont start a line with a space
                            if(tdData.col==MARQUEE.firstColOffset()) charPos++;

                            //wrap words that are too long to fit on this line
                            nextSpace = chars.indexOf(32,(charPos+1));
                            if(nextSpace==-1) nextSpace = chars.length;
                            if((tdData.col+(nextSpace-charPos)-1)>curMarqueeData.lastCol) hold=true;

                        }
                        if(!hold) {
                            td.append(EDIT.textSpan(String.fromCharCode(chars[charPos])));
                            EL.curMarquee.data().charMap[charPos] = td;
                            charPos++;
                        }
                    }

                }
            });

        },

        removeText: function(tds) {
            tds = (!tds) ? $("#grid td.ui-selected") : tds;
            tds.find("span.t").remove();
        },

        lastTextCell: function() {
            ltc = $("#grid td.ui-selected:has(span.t):last");
            if(ltc.length==0) ltc = MARQUEE.editMode.firstCell();
            return ltc;
        },

        lastTextCellOnRow: function(row) {
            ltc = $("#grid #row" + row + " td.ui-selected:has(span.t):last");
            ltcPos = CELL.getPos(ltc);
            ltc = CELL.getCell({row:ltcPos.row,col:(ltcPos.col+1)})
            return ltc; 
        },

        firstCell: function() {

            boundary = EDIT.getEditableArea();
            return CELL.getCell({row:boundary.firstRow,col:boundary.firstCol});

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
        row = EL.curMarquee.data().pos.firstRow;
        return $("#grid tr#row" + row + " td.cc").length;
    },
    firstColOffset: function() {
        cmd = EL.curMarquee.data();
        if(!cmd) return false;
        return (MARQUEE.toolOffset() + cmd.pos.firstCol);
    }
}
