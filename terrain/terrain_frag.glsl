precision mediump float;

uniform sampler2D texture;

varying vec3 fNormal;
varying vec2 fTexCoord;
varying vec3 fLightDir;

void main()
{
  vec3 normalDir = normalize(fNormal);
  vec3 lightDir = normalize(fLightDir);
  vec3 eyeDir = vec3(0.0, 0.3, 1.0);

  vec4 ambient = vec4(0.18,0.13,0.05,1.0);
  vec4 diffuse = vec4(0.61,0.43,0.18,1.0);
  vec4 specular = vec4(0.10,0.10,0.10,1.0);
  float s = 2.0;

  vec4 light = ambient;
  light += diffuse * max(dot(normalDir, lightDir), 0.0);
  light += specular * pow(max(dot(reflect(-lightDir, normalDir), eyeDir), 0.0), s);

  vec4 terrainColor = texture2D(texture,fTexCoord) * light ;

  gl_FragColor =  mix(terrainColor, vec4(0.3,0.0,0.0,1.0), 0.3);
}
