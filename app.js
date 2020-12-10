"use strict";
window.onload = InitDemo;

//load Model
async function fetchModel(location) {
    const response = await fetch(location);
    const txt = await response.text();
    const lines = txt.split(/\r*\n/);

    let v = [];
    let vt = [];
    let vn = [];
    let vbo = [];
    for (let line of lines) {
        const data = line.trim().split(/\s+/);
        const type = data.shift();
        if (type == 'v') {
            v.push(data.map(x=>{return parseFloat(x)}));
        }
        else if (type == 'vt') {
            vt.push(data.map(x=>{return parseFloat(x)}));
        }
        else if (type == 'vn') {
            vn.push(data.map(x=>{return parseFloat(x)}));
        }
        else if (type == 'f') {
            for (let fp of data) {
                const idx = fp.split('/').map(x=>{return parseInt(x)});
                v[idx[0]-1].forEach(x=>{vbo.push(x)});
                vt[idx[1]-1].forEach(x=>{vbo.push(x)});
                vn[idx[2]-1].forEach(x=>{vbo.push(x)});
            }
        }
    }
    return vbo;
};

async function createShaderProgram(gl, vertexShaderLocation, fragmentShaderLocation) {
    const vertexShaderResponse = await fetch(vertexShaderLocation);
    const vertexShaderText = await vertexShaderResponse.text();
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderText);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling vertex shader!', gl.getShaderInfoLog(vertexShader));
        return;
    }

    const fragmentShaderResponse = await fetch(fragmentShaderLocation);
    const fragmentShaderText = await fragmentShaderResponse.text();
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderText);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error('ERROR compiling fragment shader!', gl.getShaderInfoLog(fragmentShader));
        return;
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('ERROR linking program!', gl.getProgramInfoLog(program));
        return;
    }

    gl.validateProgram(program);
    if (!gl.getProgramParameter(program, gl.VALIDATE_STATUS)) {
        console.error('ERROR validating program!', gl.getProgramInfoLog(program));
        return;
    }
    return program;
}

function createSkyBoxTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('right'));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('left'));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('top'));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('bottom'));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('front'));
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
        0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
        document.getElementById('back'));
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

    return texture;
}

function createSkyBox(gl) {
    var skybox = {};

    var vertices =
        [
            -1.0,  1.0, -1.0,  // 0
            -1.0,  1.0,  1.0,  // 1
            1.0,  1.0,  1.0,  // 2
            1.0,  1.0, -1.0,  // 3
            -1.0, -1.0, -1.0,  // 4
            -1.0, -1.0,  1.0,  // 5
            1.0, -1.0,  1.0,  // 6
            1.0, -1.0, -1.0,  // 7
        ];

    var indices =
        [
            6, 2, 5,   1, 5, 2,   // front
            0, 1, 2,   0, 2, 3,   // top
            5, 1, 4,   4, 1, 0,   // left
            2, 6, 7,   2, 7, 3,   // right
            3, 7, 4,   3, 4, 0,   // back
            5, 4, 6,   6, 4, 7    // bottom
        ];

    skybox.vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skybox.vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    skybox.indexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skybox.indexBufferObject);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    skybox.draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferObject);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBufferObject);
        const positionAttribLocation = gl.getAttribLocation(this.program, 'vPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            3 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );
        gl.enableVertexAttribArray(positionAttribLocation);

        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);

        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
        gl.disableVertexAttribArray(positionAttribLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }
    return skybox;
}

async function createObject(gl, url, image, cubeTex=false) {
    let object = {};

    const vertices = await fetchModel(url);

    object.vertexBufferObject = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, object.vertexBufferObject);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    if(image){
        object.texture0 = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, object.texture0);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, document.getElementById(image));
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    if(cubeTex) object.texture1 = createSkyBoxTexture(gl);

    object.draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferObject);

        const positionAttribLocation = gl.getAttribLocation(this.program, 'vPosition');
        gl.vertexAttribPointer(
            positionAttribLocation, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            0 // Offset from the beginning of a single vertex to this attribute
        );
        gl.enableVertexAttribArray(positionAttribLocation);

        const texCoordAttribLocation = null;
        if(image){
            const texCoordAttribLocation = gl.getAttribLocation(this.program, 'vTexCoord');
            gl.vertexAttribPointer(
                texCoordAttribLocation, // Attribute location
                2, // Number of elements per attribute
                gl.FLOAT, // Type of elements
                gl.FALSE,
                8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
                3 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
            );
            gl.enableVertexAttribArray(texCoordAttribLocation);
        }

        const normalAttribLocation = gl.getAttribLocation(this.program, 'vNormal');
        gl.vertexAttribPointer(
            normalAttribLocation, // Attribute location
            3, // Number of elements per attribute
            gl.FLOAT, // Type of elements
            gl.FALSE,
            8 * Float32Array.BYTES_PER_ELEMENT, // Size of an individual vertex
            5 * Float32Array.BYTES_PER_ELEMENT // Offset from the beginning of a single vertex to this attribute
        );
        gl.enableVertexAttribArray(normalAttribLocation);

        if(image){
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, object.texture0);
        }
        if(cubeTex){
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, object.texture1);
        }

        gl.drawArrays(gl.TRIANGLES, 0, vertices.length/8);

        gl.disableVertexAttribArray(positionAttribLocation);
        gl.disableVertexAttribArray(normalAttribLocation);
        if(image) gl.disableVertexAttribArray(texCoordAttribLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    return object;
}

async function createPrograms(gl, object,shader, texture){
    console.log('Creating '+ object+'...');
    const model = await createObject(gl, './'+object+'.obj', texture, true);
    model.program = await createShaderProgram(gl, './'+shader+'_vert.glsl', './'+shader+'_frag.glsl');
    if (!model.program) {
        console.error('Cannot run without shader program!');
        return;
    }
    return [model,model.program];
}

async function InitDemo() {
    // Get WebGL context
    console.log('Getting WebGL context ...');
    const canvas = document.getElementById('desert-canvas');
    let gl = canvas.getContext('webgl');
    if (!gl) {
        console.log('WebGL not supported, falling back on experimental-webgl');
        gl = canvas.getContext('experimental-webgl');
    }
    if (!gl) {
        console.error('Your browser does not support WebGL');
        return;
    }

    const skyBoxTexture = createSkyBoxTexture(gl);

    // Create skybox
    console.log('Creating skybox ...');
    const skybox = createSkyBox(gl);
    skybox.texture = skyBoxTexture;
    skybox.program = await createShaderProgram(gl, './skybox/skybox_vert.glsl', './skybox/skybox_frag.glsl');
    if (!skybox.program) {
        console.error('Cannot run without shader program!');
        return;
    }

    // Create Helicopter Body
    let model = await createPrograms(gl, 'heliBody/heliBody', 'heliBody/heliBody', 'metal');
    const heliBody = model[0];
    heliBody.program = model[1];

    // Create Propeller
    model = await createPrograms(gl, 'heliPropeller/heliPropeller', 'heliPropeller/heliPropeller')
    const propeller = model[0];
    propeller.program = model[1];

    // Create Window
    model = await createPrograms(gl, 'heliFenster/heliFenster', 'heliFenster/heliFenster')
    const heliFenster = model[0];
    heliFenster.program = model[1];

    // Create Dead Tree
    model = await createPrograms(gl, 'terrain/baum', 'terrain/terrain','tree')
    const baum = model[0];
    baum.program = model[1];

    // Create Stone
    model = await createPrograms(gl, 'terrain/stein', 'terrain/terrain','stone')
    const stein = model[0];
    stein.program = model[1];


    // Declaration of interaction
    var angle = 0;
    let zValue = 0;
    let currentX = 0;
    let currentZ = -40;
    let currentY = 30;
    let cameraAngle = 0;
    let camera = false;
    let left = false;
    let right = false;
    let up = false;
    let down = false;
    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case "ArrowLeft":
                if(!camera){
                    cameraAngle = angle
                }
                camera = true;
                cameraAngle -= 1 ;
                break
            case "ArrowRight":
                if(!camera){
                    cameraAngle = angle
                }
                camera = true;
                cameraAngle += 1 ;
                break;
            case "ArrowUp":
                currentY += 0.2;
                break;
            case "ArrowDown":
                if(currentY > 0){
                    currentY -= 0.2;
                }
                break;
            case "w":
                up = true;
                zValue += 0.1;
                currentZ += zValue*Math.cos(glMatrix.toRadian(angle));
                currentX += zValue*Math.sin((glMatrix.toRadian(angle)));
                break;
            case "a":
                left = true;
                angle += 1;
                break;
            case "d":
                right = true;
                angle -= 1;
                break;
            case "s":
                down = true;
                zValue += 0.1;
                currentZ -= zValue*Math.cos(glMatrix.toRadian(angle));
                currentX -= zValue*Math.sin((glMatrix.toRadian(angle)))
                break
        }}, true);

    document.addEventListener('keyup', function (event){
            left = false;
            right = false;
            up = false;
            down= false;
            camera = false;
    });

    // Configure OpenGL state machine
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    // Main render loop
    let worldMatrix = mat4.create();
    let viewMatrix = mat4.create();
    const projMatrix = mat4.create();
    const transList = generateRandomTransList(100);
    mat4.perspective(projMatrix, glMatrix.toRadian(45), canvas.clientWidth / canvas.clientHeight, 0.1, 100000.0);
    const loop = function () {
        // view matrix
        const angleY = performance.now();
        mat4.lookAt(viewMatrix, [0, 50, -300], [0, 0, 0], [0, 1, 0]);
        if(!camera){
            mat4.rotate(viewMatrix, viewMatrix, glMatrix.toRadian(angle),[0,-1,0])
        }
       else {
            mat4.rotate(viewMatrix, viewMatrix, glMatrix.toRadian(cameraAngle),[0,-1,0])
        }
        mat4.translate(viewMatrix, viewMatrix, [-currentX*30,-currentY*30, -currentZ*30])


        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);

        //draw skybox
        gl.useProgram(skybox.program);
        setUniforms(gl, skybox.program, projMatrix, viewMatrix,worldMatrix, 30.0);
        skybox.draw();

        gl.enable(gl.DEPTH_TEST);

        //draw helicopter body
        gl.useProgram(heliBody.program);
        const samplerMetal = gl.getUniformLocation(heliBody.program, "sMetal");
        gl.uniform1i(samplerMetal, 0);
        let samplerCube = gl.getUniformLocation(heliBody.program, "skybox");
        gl.uniform1i(samplerCube, 1);
        setUniforms(gl, heliBody.program, projMatrix, viewMatrix, worldMatrix, 30.0, [currentX,currentY,currentZ], glMatrix.toRadian(angle),
            false, [up,down,left,right], true);
        heliBody.draw();


        //draw propeller
        gl.useProgram(propeller.program);
        samplerCube = gl.getUniformLocation(propeller.program, "skybox");
        gl.uniform1i(samplerCube, 1);
        setUniforms(gl, propeller.program, projMatrix, viewMatrix, worldMatrix, 30.0, [currentX, currentY, currentZ],
            angleY/2, true, [up,down] ,true)
        propeller.draw();

        gl.depthMask(false);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        //draw windows
        gl.useProgram(heliFenster.program);
        setUniforms(gl, heliFenster.program, projMatrix, viewMatrix, worldMatrix, 30.0, [currentX,currentY,currentZ], glMatrix.toRadian(angle), false,
            [up,down,left,right], true);
        heliFenster.draw();

        gl.disable(gl.BLEND);
        gl.depthMask(true);


        //draw stones and dead woods
        for(var i =0; i < 100; i++){
            var subList = transList[i];
            gl.useProgram(baum.program);
            let samplerWood = gl.getUniformLocation(baum.program, "texture");
            gl.uniform1i(samplerWood, 0);
            setUniforms(gl, baum.program, projMatrix, viewMatrix, worldMatrix, 300.0,
                [subList[0] * i, 0.0, subList[1] * i ], i + 2.0 * Math.PI/24)
            baum.draw();

            gl.useProgram(stein.program);
            let samplerStone = gl.getUniformLocation(stein.program, "texture");
            gl.uniform1i(samplerStone, 0);
            setUniforms(gl, stein.program, projMatrix, viewMatrix, worldMatrix, 50.0,
                [subList[1] * i , 0.0, subList[0] * i], i + 2.0 * Math.PI/24)
            stein.draw();
        }
        requestAnimationFrame(loop);
    };
    console.log('Entering rendering loop ...')
    requestAnimationFrame(loop);
};

function generateRandomTransList(max) {
    var transList = [];
    var subList = [];
    for(var i = 0; i < max; i++){
        subList = [Math.floor(Math.random() * Math.floor(max)), Math.floor(Math.random() * Math.floor(max))];
        transList.push(subList);
        subList = [];
    }
    return transList;
}

function setUniforms(gl,program, projMatrix, viewMatrix,worldMatrix, scale, trans, rotate, isPropeller= false, rotationDir=false , useEyeDir= false){
    let matProjUniformLocation = gl.getUniformLocation(program, 'mProj');
    gl.uniformMatrix4fv(matProjUniformLocation, gl.FALSE, projMatrix);

    let matViewUniformLocation = gl.getUniformLocation(program, 'mView');
    gl.uniformMatrix4fv(matViewUniformLocation, gl.FALSE, viewMatrix);

    if(useEyeDir){
        const tmpMatrix = mat4.create();
        mat4.identity(tmpMatrix);
        const invViewMatrix = mat3.create();
        mat3.fromMat4(invViewMatrix, viewMatrix);
        mat3.invert(invViewMatrix, invViewMatrix);
        const eyeDir = vec3.fromValues(0.0, 0.0, 1.0);
        vec3.transformMat3(eyeDir, eyeDir, invViewMatrix);
        let eyeDirUniformLocation = gl.getUniformLocation(program, 'eyeDir');
        gl.uniform3fv(eyeDirUniformLocation, eyeDir);
    }
    mat4.identity(worldMatrix);
    if(scale){
        mat4.scale(worldMatrix, worldMatrix, [scale,scale,scale])
    }
    if(trans){
        mat4.translate(worldMatrix,worldMatrix,[trans[0],trans[1],trans[2]]);
    }
    if(rotate){
        mat4.rotate(worldMatrix, worldMatrix, rotate, [0,1,0]);
        // UP Movement
        if(rotationDir[0]){
            if(isPropeller){
                mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(rotate*12), [0,1,0]);
            }
            if(!isPropeller){
                mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3), [1, 0, 0])
            }
        }
        //Down Movement
        if(rotationDir[1]){
            if(isPropeller){
                mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(rotate*12), [0,1,0]);
            }
            if(!isPropeller){
                mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3), [-1, 0, 0])
            }
        }
        //Left Movement
        if(rotationDir[2]){
            mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3),[0,0,-1])
            mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3),[1,0,0])
        }
        //Right Movement
        if(rotationDir[3]){
            mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3),[0,0,1])
            mat4.rotate(worldMatrix, worldMatrix, glMatrix.toRadian(3),[1,0,0])
        }
    }
    let matWorldUniformLocation = gl.getUniformLocation(program, 'mWorld');
    gl.uniformMatrix4fv(matWorldUniformLocation, gl.FALSE, worldMatrix);
}











