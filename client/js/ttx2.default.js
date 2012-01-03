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
    clipboard: {},
    chars: " `!@#$%^&*()_+{}|:<>?,1234567890-=qwertyuiop[]\asdfghjkl;'zxcvbnm''./ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    $cells: {},
    $rows: {},
    ccAttrs: ["background","color","foreground","text","graphics","new"],
    FN: {
        getPostLoadData: function() {
            DATA = $.extend(DATA, {
                tdAttrs: CELL.getTDAttrs(),
                canvasHeight: (DATA.blockY *  DATA.cols),
                canvasWidth: (DATA.blockX * DATA.rows)
            });

        }
    }
}

var EL = {}
