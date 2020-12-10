precision mediump float;

uniform samplerCube skybox;
varying vec3 fTexCoord;

void main()
{
  gl_FragColor = textureCube(skybox, fTexCoord);
}
