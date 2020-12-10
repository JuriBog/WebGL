precision mediump float;


uniform samplerCube skybox;
uniform sampler2D sMetal;


varying vec3 fEyeDir;
varying vec3 fNormal;
varying vec2 fTexCoord;

varying vec3 fLightDir;

void main()
{
  vec3 eyeDir = normalize(fEyeDir);
  vec3 normalDir = normalize(fNormal);
  vec3 lightDir = normalize(fLightDir);
  vec3 eyeDirSpec = vec3(0.0, 0, 0.5);

  //Bronze
  vec4 ambient = vec4(0.21,0.13,0.05,1.0);
  vec4 diffuse = vec4(0.71,0.43,0.18,1.0);
  vec4 specular = vec4(0.39,0.27,0.17,1.0);
  float s = 25.6;

  vec4 light = ambient;
  light += diffuse * max(dot(normalDir, lightDir), 0.0);
  light += specular * pow(max(dot(reflect(-lightDir, normalDir), eyeDirSpec), 0.0), s);

  vec4 scratch = texture2D(sMetal,fTexCoord) * light ;
  vec4 reflection = textureCube(skybox, reflect(-eyeDir, normalDir));

  gl_FragColor = mix(scratch, reflection, 0.2);
}
