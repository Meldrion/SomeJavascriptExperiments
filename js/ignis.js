const DIRECTION_UP = 0x0;
const DIRECTION_DOWN = 0x1;
const DIRECTION_LEFT = 0x2;
const DIRECTION_RIGHT = 0x3;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Used to detect whether the users browser is an mobile browser
function isMobile() {
    ///<summary>Detecting whether the browser is a mobile browser or desktop browser</summary>
    ///<returns>A boolean value indicating whether the browser is a mobile browser or not</returns>

    if (sessionStorage.desktop) // desktop storage
        return false;
    else if (localStorage.mobile) // mobile storage
        return true;

    // alternative
    var mobile = ['iphone', 'ipad', 'android', 'blackberry', 'nokia', 'opera mini', 'windows mobile', 'windows phone', 'iemobile'];
    for (var i in mobile) if (navigator.userAgent.toLowerCase().indexOf(mobile[i].toLowerCase()) > 0) return true;

    // nothing found.. assume desktop
    return false;
}

function getFullscreenDimension() {
    var dimension = [];

    if (isMobile()) {
        dimension.push(window.screen.width * window.devicePixelRatio);
        dimension.push(window.screen.height * window.devicePixelRatio);
    } else {
        dimension.push((window.innerWidth) * window.devicePixelRatio);
        dimension.push((window.innerHeight) * window.devicePixelRatio);
    }

    return dimension;
}

function startApp() {

    var dimension = getFullscreenDimension();
    var app = new PIXI.Application(dimension[0], dimension[1], {backgroundColor: 0x1099bb,
                                                                autoStart: false,
                                                                forceFXAA:false,
                                                                resolution:1});

    var canvas = app.view;
    var mouseInside = false;

    document.body.appendChild(canvas);
    canvas.onmouseleave = function(event) {
        mouseInside = false;
        app.ticker.update();
    };

    canvas.onmouseenter = function(event) {
        mouseInside = true;
        app.ticker.update();
    };

    var tileset = PIXI.Texture.fromImage("res/cave.png");
    tileset.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;

    var tile = [];
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(0, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(32, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(64, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(32, 32, 32, 32)));



    var mapWidth = 250;
    var mapHeight = 50;
    var layerCount = 3;
    var zoom = 2;
    var cellSize = 32;


    var matrix = new Array(mapWidth);

    for (var i = 0; i < mapWidth; i++) {
        matrix[i] = new Array(mapHeight);
        for (var j = 0; j < mapHeight; j++) {
            matrix[i][j] = new Array(layerCount);
            for (var z = 0; z < layerCount; z++) {

                var spriteTile = null;

                if (i * cellSize * zoom < dimension[0] && j * cellSize * zoom < dimension[1]) {
                    spriteTile = new PIXI.Sprite(tile[z]);
                } else {
                    spriteTile = new PIXI.Sprite(tile[layerCount - z]);
                }

                spriteTile.scale.x = zoom;
                spriteTile.scale.y = zoom;
                spriteTile.x = i * cellSize * zoom;
                spriteTile.y = j * cellSize * zoom;
                spriteTile.zIndex = 5+z;
                //spriteTile.zoom

                matrix[i][j][z] = spriteTile;
            }
        }
    }

    // Cursor Tiles
    var cursorTexture = new PIXI.Texture(tileset, new PIXI.Rectangle(0,4*32,3*32,5*32));
    var cursorSprite = new PIXI.Sprite(cursorTexture);
    cursorSprite.scale.x = zoom;
    cursorSprite.scale.y = zoom;
    cursorSprite.alpha = 0.5;
    cursorSprite.zIndex = 11;

    var dim = [];
    dim.push(Math.ceil(dimension[0] / (cellSize * zoom)));
    dim.push(Math.ceil(dimension[1] / (cellSize * zoom)));

    hanldeScreenBuild(app.stage, matrix, dim);

    app.stage.addChild(cursorSprite);

    var graphics = new PIXI.Graphics();
    // set a fill and line style
    graphics.beginFill(0xFF0000);
    graphics.lineStyle(0, 0xff0000, 0);
    graphics.fillAlpha = 0.75;
    graphics.lineAlpha = 0.75;
    graphics.drawRect(0, 0, 32, 32);
    graphics.zIndex = 10;

    app.stage.addChild(graphics);
    app.stage.interactive = true;
    app.stage.hitArea = new PIXI.Rectangle( 0, 0, dimension[0], dimension[1]);

    var mouseX = 0;
    var mouseY = 0;

    /* call this function whenever you added a new layer/container */
    app.stage.updateLayersOrder = function () {
        app.stage.children.sort(function(a,b) {
            a.zIndex = a.zIndex || 0;
            b.zIndex = b.zIndex || 0;
            return a.zIndex - b.zIndex
        });
    };

    //app.stage.updateLayersOrder();
    /*
        These are the different choice on can have to bind a mouse / touch listener

        .on('mousedown', onDragStart)
        .on('touchstart', onDragStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove);
     */

    app.stage.mousemove = function (event) {
        var cellDotZoom = cellSize * zoom;
        mouseX = Math.floor(event.data.global.x / cellDotZoom) * cellDotZoom;
        mouseY = Math.floor(event.data.global.y / cellDotZoom) * cellDotZoom;
        cursorSprite.x = mouseX;
        cursorSprite.y = mouseY;
    };

    app.stage.click = app.stage.mousemove;
    app.stage.tap = app.stage.click;
    app.stage.touchmove = app.stage.mousemove;

    var oldX = -1;
    var oldY = -1;
    var lastTime = -1;
    var inTimeOut = false;
    var lastEvent = null;
    const MAX_REFRESH_TIME = 32;
    canvas.onmousemove = function(event) {

        lastEvent = event;
        var cellDotZoom = cellSize * zoom;
        var newX = Math.floor(event.x / cellDotZoom);
        var newY = Math.floor(event.y / cellDotZoom);
        if (oldX !== newX || oldY !== newY) {
            oldX = newX;
            oldY = newY;

            var date = new Date();
            var time = date.getTime();
            var delta = time - lastTime;

            if (delta > MAX_REFRESH_TIME) {
                app.ticker.update();
                lastTime = time;
            } else {
                if (!inTimeOut) {
                    inTimeOut = true;
                    window.setTimeout(function() {
                        inTimeOut = false;
                        canvas.onmousemove(lastEvent);
                    },MAX_REFRESH_TIME - delta);
                }
            }
        }
    };

    // Listen for animate update
    var position = [];
    position.push(0);
    position.push(0);

    var left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40);

    right.press = function() {
        moveRight(app.stage, matrix, dim, position,cellSize,zoom);
        app.ticker.update();
    };

    left.press = function() {
        moveLeft(app.stage,matrix,dim,position,cellSize,zoom);
        app.ticker.update();
    };

    up.press = function() {
        moveTop(app.stage,matrix,dim,position,cellSize,zoom);
        app.ticker.update();
    };

    down.press = function() {
        moveBottom(app.stage,matrix,dim,position,cellSize,zoom);
        app.ticker.update();
    };


    app.stage.updateLayersOrder();

    app.ticker.add(function (delta) {

        graphics.clear();
        //graphics.drawRect(getRandomInt(0, dimension[0]), getRandomInt(0, dimension[1]), 32, 32);
        cursorSprite.visible = mouseInside;
        if (mouseInside) {
            graphics.drawRect(mouseX, mouseY, 3*cellSize*zoom, 5*cellSize*zoom);
        }
    });

    window.onresize = function () {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    };
}

window.onload = function () {
    startApp();
};

function hanldeScreenBuild(stage, matrix, dimension) {

    // Remove all children first
    while (stage.children[0]) {
        stage.removeChild(stage.children[0]);
    }

    var maxX = Math.min(matrix.length,dimension[0]);
    var maxY = Math.min(matrix[1].length,dimension[1]);

    for (var i = 0; i < maxX; i++) {
        for (var j = 0; j < maxY; j++) {

            for (var z = 0; z < matrix[0][0].length; z++) {
                var sprite = matrix[i][j][z];
                stage.addChild(sprite);
            }
        }
    }
}

function moveRight(stage, matrix, dimension, position,cellSize,zoom) {
    moveH(stage,matrix,dimension,position,1,cellSize,zoom);
}

function moveLeft(stage, matrix, dimension,position,cellSize,zoom) {
    moveH(stage,matrix,dimension,position,-1,cellSize,zoom)
}

function moveTop(stage, matrix, dimension,position,cellSize,zoom) {
    moveV(stage,matrix,dimension,position,-1,cellSize,zoom);
}

function moveBottom(stage, matrix, dimension,position,cellSize,zoom) {
    moveV(stage,matrix,dimension,position,1,cellSize,zoom)
}

/**
 *
 * @param stage
 * @param matrix
 * @param dimension
 * @param position
 * @param xAdd
 * @param cellSize
 * @param zoom
 */
function moveH(stage, matrix, dimension, position,xAdd,cellSize,zoom) {
    var y, z;

    var posXWithAdd = position[0] + dimension[0] + xAdd;
    if ( position[0] + xAdd < 0 || matrix.length <=  posXWithAdd )
        return;

    var leftYRow = xAdd > 0 ? matrix[position[0]] : matrix[position[0]-1]; // First row on the left
    var rightYRow = matrix[Math.ceil(position[0] + dimension[0])]; // First row on the right

    removeVerticalRowsOutofView(stage,position,dimension,xAdd > 0 ? leftYRow : rightYRow);
    moveWorld(matrix,xAdd,0,cellSize,zoom);

    for (y = position[1]; y < position[1] + dimension[1]; y++) {
        for (z = 0; z < rightYRow[0].length; z++) {
            stage.addChild(xAdd > 0 ? rightYRow[y][z] : leftYRow[y][z]);
        }
    }

    stage.updateLayersOrder();
    position[0] += xAdd;
}

/**
 *
 * @param stage
 * @param matrix
 * @param dimension
 * @param position
 * @param yAdd
 * @param cellSize
 * @param zoom
 */
function moveV(stage, matrix, dimension, position,yAdd,cellSize,zoom) {
    var x, z;

    var posYWithAdd = position[1] + dimension[1] + yAdd;
    if (position[1] + yAdd < 0 || matrix[0].length <= posYWithAdd)
        return;

    removeHorizontalRowsOutofView(stage,position,dimension,matrix, yAdd > 0 ?  DIRECTION_DOWN : DIRECTION_UP);
    moveWorld(matrix,0,yAdd,cellSize,zoom);

    var zRow;
    for (x = position[0]; x < position[0] + dimension[0]; x++) {
        zRow = matrix[x][yAdd > 0 ? position[1] + dimension[1] : position[1]];

        for (z = 0; z < zRow.length; z++) {
            stage.addChild(zRow[z]);
        }
    }

    stage.updateLayersOrder();
    position[1] += yAdd;
}


/**
 *
 * @param matrix
 * @param xAdd
 * @param yAdd
 * @param cellSize
 * @param zoom
 */
function moveWorld(matrix,xAdd,yAdd,cellSize,zoom) {

    var x,y,z;
    var yRow, zRow;
    var sprite;

    for (x = 0;x < matrix.length; x++)  {
        yRow = matrix[x];
        for (y = 0;y < yRow.length; y++)  {
            zRow = yRow[y];
            for (z = 0;z < zRow.length; z++)  {
                sprite = zRow[z];
                sprite.x -= xAdd * cellSize * zoom;
                sprite.y -= yAdd * cellSize * zoom;
            }
        }
    }
}

/**
 *
 * @param stage
 * @param position
 * @param dimension
 * @param yRow
 */
function removeVerticalRowsOutofView(stage,position,dimension,yRow) {
    var  y, z;
    var zRow;
    for (y = position[1]; y < position[1] + dimension[1]; y++) {
        zRow = yRow[y];
        for (z = 0; z < zRow.length; z++) {
            stage.removeChild(zRow[z]);
        }
    }
}

/**
 *
 * @param stage
 * @param position
 * @param dimension
 * @param matrix
 * @param direction
 */
function removeHorizontalRowsOutofView(stage,position,dimension,matrix,direction) {
    var  x,z;
    var zRow;
    for (x = position[0]; x < position[0] + dimension[0]; x++) {
        zRow = matrix[x][direction === DIRECTION_DOWN ? position[1]: position[1]+dimension[1]];
        for (z = 0; z < zRow; z++) {
            stage.removeChild(zRow[z]);
        }
    }
}