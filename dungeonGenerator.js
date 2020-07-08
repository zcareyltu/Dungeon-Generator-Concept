var img;

btnClick();

function btnClick() {
    var canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, 500, 500);

    var body = document.getElementById("body");
    if(img) body.removeChild(img);
    //while(body.firstChild) body.removeChild(body.firstChild);

    img = document.createElement('img');
    img.src = canvas.toDataURL("image/png"); //'https://media.geeksforgeeks.org/wp-content/uploads/20190529122828/bs21.png';
    body.appendChild(img);
}