precision mediump float;

uniform samplerCube skybox;
varying vec3 fEyeDir;
varying vec3 fNormal;
void main()
{
  vec3 eyeDir = normalize(fEyeDir);
  vec3 normalDir = normalize(fNormal);
  vec4 reflection = textureCube(skybox, reflect(-eyeDir, normalDir));
  vec3 color = mix(reflection.rgb,vec3(1.0,0.0,0.0), 0.4);
  gl_FragColor =  vec4(color,0.2);
}
