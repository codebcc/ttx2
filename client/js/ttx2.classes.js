//color info model
COLORS = {
    red:{
    	name: "Red",
    	rgb: [255,  47,  21],
		hex: "f00",
        sname: "R",
        contrast: "dark",
        textCC: 129,
        graphicsCC: 145
    },
    yellow: {
    	name: "Yellow",
    	rgb: [255, 253,  51],
		hex: "ff0",
        sname: "Y",
        contrast: "dark",
        textCC: 131,
        graphicsCC: 147
    },
    blue: {
    	name: "Blue",
    	rgb: [  0,  39, 252],
		hex: "00f",
        sname: "BL",
        contrast: "light",
        textCC: 132,
        graphicsCC: 148
    },
    magenta: {
    	name: "Magenta",
    	rgb: [255,  63, 253],
		hex: "f0f",
        sname: "M",
        contrast: "dark",
        textCC: 133,
        graphicsCC: 149
    },
    green: {
    	name: "Green",
    	rgb: [  0, 250,  44],
		hex: "0f0",
        sname: "G",
        contrast: "dark",
        textCC: 130,
        graphicsCC: 146
    },
    cyan: {
    	name: "Cyan",
    	rgb: [  0, 252, 255],
		hex: "0ff",
        sname: "C",
        contrast: "light",
        textCC: 134,
        graphicsCC: 150
    },
    black: {
    	name: "Black",
    	rgb: [  0,   0,   0],
		hex: "000",
        sname: 'BK',
        contrast: "light"
    },
    white: {
    	name: "White",
    	rgb: [255, 255, 255],
		hex: "fff",
        sname: "W",
        contrast: "dark",
        textCC: 135,
        graphicsCC: 151
    }
}

var ccs = {
    b_r: {
        unicode: "014E",
        title: "Background Red"
    },
    b_y: {
        unicode: "014F",
        title: "Background Yellow"
    },
    b_bl: {
        unicode: "0150",
        title: "Background Blue"
    },
    b_m: {
        unicode: "0151",
        title: "Background Magenta"
    },
    b_c: {
        unicode: "0153",
        title: "Background Cyan"
    },
    b_g: {
        unicode: "0152",
        title: "Background Green"
    },
    b_n: {
        unicode: "0145",
        title: "New Background"
    },
    b_bk: {
        unicode: "0145",
        title: "Background Black"
    },
    b_w: {
        unicode: "0154",
        title: "Background White"
    },
    g_r: {
        unicode: "0147",
        title: "Graphics Red"
    },
    g_y: {
        unicode: "0148",
        title: "Graphics Yellow"
    },
    g_bl: {
        unicode: "0149",
        title: "Graphics Blue"
    },
    g_m: {
        unicode: "014A",
        title: "Graphics Magenta"
    },
    g_g: {
        unicode: "014B",
        title: "Graphics Green"
    },
    g_c: {
        unicode: "014C",
        title: "Graphics Cyan"
    },
    g_w: {
        unicode: "014D",
        title: "Graphics White"
    },
    t_r: {
        unicode: "014E",
        title: "Text Red"
    },
    t_y: {
        unicode: "014F",
        title: "Text Yellow"
    },
    t_bl: {
        unicode: "0150",
        title: "Text Blue"
    },
    t_m: {
        unicode: "0151",
        title: "Text Magenta"
    },
    t_g: {
        unicode: "0152",
        title: "Text Green"
    },
    t_c: {
        unicode: "0153",
        title: "Text Cyan"
    },
    t_w: {
        unicode: "0154",
        title: "Text White"
    }
}

var TOOLSETS = {

    color: {

        id: "color",

        contents: {
            BGColor: {
                title: "Background Color",
                id: "BGColor",
                data: {
                    background: "background",
                },
                buildFunction: function() {
                    TOOLS.buildColors(this);
                }
            },
            textColor: {
                title: "Text Color",
                id: "textColor",
                data: {
                    foreground: "foreground",
                    text: "text",
                },
                buildFunction: function() {
                    TOOLS.buildColors(this);
                }
            },
            graphicsColor: {
                title: "Graphics Color",
                id: "graphicsColor",
                data: {
                    foreground: "foreground",
                    graphics: "graphics",
                },
                buildFunction: function() {
                    TOOLS.buildColors(this);
                }
            }
        }
    },
    preview: {
        id: "preview",
        title: "Preview",
        type: "checkbox",
        changeFunction: function() {
            EL.canvas.toggleClass("preview");             
        }
    },
    drawing: {
        id: "drawing",
        title: "Drawing",
        contents: {
            pen: {
                id: "pen",
                title: "Pen",
                changeFunction: function() {
                    EDIT.drawing.init();
                }
            }
        }
    }
}


