precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;

attribute vec3 vPosition;
attribute vec3 vNormal;
attribute vec2 vTexCoord;

varying vec3 fNormal;
varying vec2 fTexCoord;
varying vec3 fLightDir;

void main()
{
  vec3 lightDir = vec3(0.0, 0.6, 1.0);
  fLightDir = (mView * vec4(lightDir, 0.0)).xyz;
  fNormal = (mWorld * vec4(vNormal, 0.0)).xyz;
  fTexCoord = vTexCoord;
  gl_Position = mProj * mView * mWorld * vec4(vPosition, 1.0);
}
