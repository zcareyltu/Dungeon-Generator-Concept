(function (HTML) {

    HTML.getListValue = function(id, defaultValue){
        var e = document.getElementById(id);
        var str = e.options[e.selectedIndex].value;

        if(str) return str;
        else return defaultValue;
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

            pixel: function(x, y, color) {
                if(color == undefined) color = [0, 0, 0];
                g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
                g.fillRect(x, y, 1, 1);
            }
        };
    };

}(window.HTML = window.HTML || {}));