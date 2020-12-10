precision mediump float;

uniform mat4 mWorld;
uniform mat4 mView;
uniform mat4 mProj;
uniform vec3 eyeDir;
attribute vec3 vPosition;
attribute vec3 vNormal;
varying vec3 fEyeDir;
varying vec3 fNormal;

void main()
{
  fEyeDir = eyeDir;
  fNormal = (mWorld * vec4(vNormal, 0.0)).xyz;
  gl_Position = mProj * mView * mWorld * vec4(vPosition, 1.0);
}
