(function (HTML) {

    HTML.getListValue = function(id, defaultValue){
        var e = document.getElementById(id);
        var str = e.options[e.selectedIndex].value;

        if(str) return str;
        else return defaultValue;
    };

    HTML.getNumberValue = function(id, defaultValue){
        var e = document.getElementById(id);
        var str = e.value;

        if(str){
            var number = parseInt(str);
            if(number){
                return number;
            }
        }
        return defaultValue;
    };

    var img;

    HTML.displayCanvas = function(canvas, id){
        var body = document.getElementById(id);
        if(img) body.removeChild(img);
        img = document.createElement('img');
        img.src = canvas.toDataURL("image/png");
        body.appendChild(img);
    };

    HTML.generateCanvas = function(width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = (width == undefined) ? 0 : width;
        canvas.height = (height == undefined) ? 0 : height;
        return canvas;
    };

    HTML.getGraphics = function(canvas) {
        var g = canvas.getContext("2d");
        return {
            line: function(x1, y1, x2, y2, color) {
                if(color == undefined) color = [0, 0, 0];
                g.strokeStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.beginPath();
                g.moveTo(x1, y1);
                g.lineTo(x2, y2);
                g.stroke();
            },

            rect: function(x, y, w, h, color) {
                if(color == undefined) color = [0, 0, 0];
                g.strokeStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.rect(x, y, w, h);
                g.stroke();
            },

            fillRect: function(x, y, w, h, color) {
                if(color == undefined) color = [0, 0, 0];
                g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.fillRect(x, y, w, h);
            },

            fill: function(color) {
                this.fillRect(0, 0, canvas.width, canvas.height, color);
            },

            pixel: function(x, y, color) {
                if(color == undefined) color = [0, 0, 0];
                g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.fillRect(x, y, 1, 1);
            },

            copyImage: function(canvas, dx, dy, dw, dh, sx, sy, sw, sh){
                if(arguments.length === 1){
                    g.drawImage(canvas, 0, 0);
                }else if(arguments.length === 3){
                    g.drawImage(canvas, dx, dy);
                }else if(arguments.length === 5){
                    g.drawImage(canvas, dx, dy, dw, dh);
                }else if(arguments.length === 7){
                    g.drawImage(canvas, sx, sy, canvas.width, canvas.height, dx, dy, dw, dh);
                }else if(arguments.length === 9){
                    g.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
                }
            },

            //0 means no transparency, completely opaque.
            //1 means full transparency, completely invisible
            setTransparency: function(transparency){
                g.globalAlpha = 1-transparency;
            },

            setTextAlignCenter: function(){
                g.textAlign = 'center';
            },

            fillText: function(text, x, y, font, color){
                g.font = font;
                g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.fillText(text, x, y);
            },

            getTextSize: function(text, font){
                g.font = font;
                return g.measureText(text);
            },

            getTextWidth: function(text, font){
                g.font = font;
                return g.measureText(text).width;
            },

            getTextHeight: function(text, font){
                g.font = font;
                return g.measureText(text).height;
            }

        };
    };

    HTML.addKeyDownListener = function(callback){
        document.addEventListener("keydown", callback);
    }

    HTML.addKeyUpListener = function(callback){
        document.addEventListener("keyup", callback);
    }

    //Returns a timer ID
    HTML.addTimer = function(callback, intervalMS){
        return setInterval(callback, intervalMS);
    }

    HTML.stopTimer = function(timerID){
        clearInterval(timerID);
    }

}(window.HTML = window.HTML || {}));

const Keys = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Control: 17,
    Alt: 18,
    CapsLock: 20,
    Space: 32,
    LeftArrow: 37,
    UpArrow: 38,
    RightArrow: 39,
    DownArrow: 40,

    '0': 48,
    '1': 49,
    '2': 50,
    '3': 51,
    '4': 52,
    '5': 53,
    '6': 54,
    '7': 55,
    '8': 56,
    '9': 57,

    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72, 
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    
    Numpad0: 96,
    Numpad1: 97,
    Numpad2: 98,
    Numpad3: 99,
    Numpad4: 100,
    Numpad5: 101,
    Numpad6: 102,
    Numpad7: 103,
    Numpad8: 104,
    Numpad9: 105,
    NumpadMultiply: 106,
    NumpadAdd: 107,
    NumpadSubtract: 109,
    NumpadDecimal: 110,
    NumpadDivide: 111,

    Semicolon: 186,
    Comma: 188,
    Period: 190,
    Slash: 191,
    Tilde: 192,
    
    LeftBracket: 219,
    Backslash: 220,
    RightBracket: 221,
    Apostrophe: 222

};
Object.freeze(Keys);