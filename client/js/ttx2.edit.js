var EDIT = {

    tdClick: function(t) {
        
        curData = EL.curMarquee.data("pos");
        //set new word to last space if one exists
        $spans = $("#grid #row" + t.data("row") + " td:lt(" + t.data("col") + "):gt(" + curData.firstCol + ") span.t");
        $spans.each(function() {
            t = $(this);
            if(t.text()==" ") DATA.newWord = ($spans.index(t));
        })
        DATA.newWord = false;

    }, 

    cursor: {

        init: function(td) {
            EDIT.cursor.remove();
            td.append(
                $('<div id="cursor"/>').data("pos",td)
            )
            EL.cursor = $("#cursor");
            EDIT.keys.init();

            //determine if we need inset mode EG cursor is in the middle of text
            DATA.lastTextCell = $("#grid td.ui-selected:has(span.t):last");
            ltcPos = CELL.getPos(DATA.lastTextCell);
            cPos = CELL.getPos(EL.cursor.parent());
            insertMode = false;

            if(DATA.clipboard.insert) if(DATA.clipboard.insert.length>0) {
                DATA.insertMode = true;
                insertMode = true;
            }
            if(!insertMode) DATA.insertMode = (cPos.row<ltcPos.row) ? true : (cPos.row==ltcPos.row) ? ((cPos.col<=ltcPos.col) ? true : false) : false;

        },



        remove: function() {
            $("#cursor").remove();
        },

        move: function(o) {

            dir = o.direction;

            curData = CELL.getPos();
            lastColCell = CELL.getCell({row:curData.row,col:lastCol,noBoundary:true});                
            boundary = MARQUEE.getEditableArea();

            if(DATA.insertMode && !o.arrow) {
                EDIT.cut({
                    start: EL.cursor.parent(),
                    end: DATA.lastTextCell,
                    clipboard: "insert",
                    data: true
                });
            }

            if(dir=="backward") {
                
                nextCell = CELL.getCell({row:curData.row,col:(curData.col-1)});
                if(o.delete) {
                    ltc = CELL.lastTextCellOnRow(nextCell.data().row);
                    nextCell = CELL.getCell({row:nextCell.data().row,col:((ltc.length>0) ? ltc.data().col : boundary.firstCol)});
                }


            } else if(dir=="forward") {

                nextCell = CELL.getCell({row:curData.row,col:(curData.col+1)});

                if(nextCell.data().row>curData.row) {

                    //we're going down a row                    
                    //check if we need to bring a word with us
                    if(DATA.newWord!=undefined) {


                        EDIT.cut({
                            start: DATA.newWord,
                            end: lastColCell
                        });

                        if(DATA.clipboard.copy.length>0) {
                            nextCell = EDIT.paste({cell: nextCell});
                            nextCell = CELL.getCell({row:nextCell.data("row"),col:(nextCell.data("col")+1)});
                        }

                        DATA.newWord = false;

                    }
                
                }

            } else if(o.arrow) {
                if(dir=="up") {
                    nextCell = CELL.getCell({row:(curData.row-1),col:curData.col});
                } else if (dir=="down") {
                    nextCell = CELL.getCell({row:(curData.row+1),col:curData.col});
                } else if (dir=="left") {
                    nextCell = CELL.getCell({row:curData.row,col:(curData.col-1)});
                } else if (dir=="right") {
                    nextCell = CELL.getCell({row:curData.row,col:(curData.col+1)});
                }
            }

            if(o.delete) nextCell.find("span.t").remove();
            EDIT.cursor.init(nextCell);
            if(DATA.insertMode) MARQUEE.editMode.drawText({insert:true});

        },



        newLine: function(td) {
            
            ch = EDIT.textSpan("13", "special");
            td.append(ch);

            curData = EL.cursor.data("pos").data();
            marqueeData = EL.curMarquee.data();

            nextRow = (curData.row<marqueeData.pos.lastRow) ? (curData.row+1) : curData.row;
            nextCol = MARQUEE.toolOffset() + EL.curMarquee.data().pos.firstCol;

            nextCell = CELL.getCell({row:nextRow,col:nextCol});

            EDIT.cursor.init(nextCell);

        }


    },

    cut: function(o) {

        sPos = o.start.data();
        ePos = o.end.data();

        clipboard = o.clipboard ? o.clipboard : "copy";
        DATA.clipboard[clipboard] = [];

        firstCol = sPos.col+1;
        lastCol = ePos.col;
        firstRow = sPos.row;
        lastRow = ePos.row;


        var $spans = [];
        var data = "";

        CANVAS.loop({

            firstCol: firstCol,
            lastCol: lastCol,
            firstRow: firstRow,
            lastRow: lastRow,
            inclusive: true,

            tdFunction: function(td) {
                span = td.find("span.t");
                if((span.length>0) && (span.text().charCodeAt()!=0)) {
                    $spans.push(span);
                    data+=span.text().charCodeAt() + ";";
                    span.remove();
                }
            }

        })

        DATA.clipboard[clipboard] = o.data ? data : $($spans);

    },

    paste: function(o) {

        cell = o.cell ? o.cell : EL.cursor.parent();
        clipboard = o.clipboard ? o.clipboard : "copy";

        var col = cell.data().col;
        var row = cell.data().row;

        var clipPos = 0;

        var td_;
        var hold = false;

        if(DATA.clipboard[clipboard]) {

            CANVAS.loop({
                
                firstCol: col,
                firstRow: row,
                inclusive: true,
                until: function() {
                   return (clipPos>=DATA.clipboard[clipboard].length);
                },
                trFunction: function(tr) {
                    if(hold) {
                        hold = false;
                        clipPos++;
                    }
                },
                tdFunction: function(td) {
                    t = DATA.clipboard[clipboard][clipPos];
                    td.append(t);
                    td_ = td;
                    clipPos++;
                }
            });

            return td_;
        }
    },

    keys: {
        
        init: function() {

            if($(document).data("events").keypress) return false;

            $(document).keypress(function(e) {
                key = (String.fromCharCode(e.charCode));
                td = EL.cursor.data("pos");
                td.find("span.t").remove();

                if(e.charCode==32) {
                    //space
                    DATA.newWord= td;

                }
                if(e.charCode==13) {
                    //return
                    EDIT.cursor.newLine(td);
                
                } else if(DATA.chars.indexOf(key)>-1) {

                    ch = EDIT.textSpan(key);
                    td.append(ch); 
                    EDIT.cursor.move({direction:"forward"});

                }

                return false;
            });

            $(document).jkey('backspace', function() {

                
                if($("div.marquee.edit").length>0) {

                    EDIT.cursor.move({
                        direction: "backward",
                        delete: true
                    })

                }

            }).jkey('up,down,left,right', function(e) {
                EDIT.cursor.move({direction:e,arrow:true});
            });


        },

        cancel: function() {

            $(document).unbind("keypress");

        }

    },

    textSpan: function(key, special) {

        return $('<span class="t"/>').addClass(special ? "s": "").text(key);

    }

}