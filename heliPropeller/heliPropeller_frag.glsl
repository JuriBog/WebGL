precision mediump float;

uniform samplerCube skybox;
varying vec3 fEyeDir;
varying vec3 fNormal;
void main()
{
  vec3 eyeDir = normalize(fEyeDir);
  vec3 normalDir = normalize(fNormal);
  vec3 reflection = textureCube(skybox, reflect(-eyeDir, normalDir)).rgb;
  gl_FragColor =  vec4(vec3(0.41,0.41,0.41)*reflection.rgb, 1.0);
}
