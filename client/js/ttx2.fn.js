var CELL = {
     getPos: function(cell) {
        cell = cell ? cell : EL.cursor.data().pos;
        return {
            row: cell.data("row") ,
            col: cell.data("col")
        }   
    },
    getCell: function(o) {

        if(!o.noBoundary) boundary = MARQUEE.getEditableArea(o);

        row = o.row;
        col = o.col;

        if(col>boundary.lastCol) {
            if(row==boundary.lastRow) {
                col--;
            } else {
               row++;
               col = boundary.firstCol;
            }

        } else if(row>boundary.lastRow) {
            row--;
        } else if(col<boundary.firstCol) {
            if(row==boundary.firstRow) {
                col++;
            } else {
                row--;
                col = boundary.lastCol;
            }
        } else if(row<boundary.firstRow) {
            row++;
        }

        return DATA.$cells["cell" + row + "_" + col];
    },
    lastTextCellOnRow: function(row) {
        return $("#grid #row" + row + " td.ui-selected:has(span.t):last")
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
    },
}

var FN = {

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
    charDataToWords: function(data) {
        letters = data.split(";");
        words = "";
        for(i in letters) {
            words += String.fromCharCode(letters[i]);
        }
        return words;
    }
}