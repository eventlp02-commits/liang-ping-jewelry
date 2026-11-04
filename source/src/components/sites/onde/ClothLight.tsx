"use client";
import { useEffect, useRef } from "react";
import { localAsset } from "./assets.mjs";
import { Mesh, OrthographicCamera, PlaneGeometry, Scene, ShaderMaterial, TextureLoader, Vector2, WebGLRenderer } from "three";

const vertex = `
varying vec2 vUv;
void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}
`;

// Refraction stays in the cloth texture; the highlights follow its folds instead of the cursor itself.
const fragment = `
uniform sampler2D cloth;
uniform vec2 viewport, pointer;
uniform float time, chapter, emphasis;
varying vec2 vUv;
void main() {
  float aspect=viewport.x/viewport.y;
  vec2 uv=(vUv-.5)*vec2(min(1.,aspect/1.778),min(1.,1.778/aspect))+.5;
  vec2 p=vec2(vUv.x*aspect,vUv.y);
  vec2 light=vec2(pointer.x*aspect,pointer.y);
  float distanceToLight=length(p-light);
  float wave=sin(uv.x*8.2+uv.y*7.1+time*.25);
  vec2 drift=vec2(.012*wave+.008*cos(uv.y*10.-time*.17), .009*sin(uv.x*11.+time*.21));
  drift+=.016*(pointer-.5)*exp(-1.4*distanceToLight);
  uv=uv*.95+.025+drift;
  vec3 fiber=.42*texture2D(cloth,uv).rgb+.29*texture2D(cloth,uv+.0017).rgb+.29*texture2D(cloth,uv-.0017).rgb;
  float tone=dot(fiber,vec3(.28,.55,.17));
  float rim=texture2D(cloth,uv+vec2(.004,-.002)).r-tone;
  float caustic=pow(max(0.,.5+.5*sin(uv.y*16.+uv.x*10.+wave*1.65+time*.18+pointer.x*2.2)),12.);
  float beam=caustic*(.017+.061*emphasis)*(.36+.64*exp(-1.3*distanceToLight));
  vec3 shade=mix(vec3(.75,.765,.755),vec3(.71,.74,.675),chapter);
  vec3 silk=mix(shade,vec3(1.,.995,.976),clamp((tone-.53)*2.13,0.,1.));
  silk+=rim*.55 + beam*vec3(1.,.88,.70);
  silk-=.016*smoothstep(.2,1.1,distanceToLight);
  gl_FragColor=vec4(silk,1.);
}`;

export function ClothLight({ chapter, held }: {chapter: number; held: boolean}) {
  const node = useRef<HTMLDivElement>(null);
  const mood = useRef({chapter, held});
  useEffect(() => { mood.current = {chapter, held}; }, [chapter, held]);
  useEffect(() => {
    const host = node.current;
    if (!host) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, disposed = false, loaded = false, failed = false, last = 0, elapsed = 0;
    let renderer: WebGLRenderer;
    try { renderer = new WebGLRenderer({alpha:false, antialias:false, powerPreference:"low-power"}); }
    catch { return; }
    host.append(renderer.domElement);
    const style = renderer.domElement.style;
    style.opacity = "0";
    const target = new Vector2(.58,.56);
    const geometry = new PlaneGeometry(2,2);
    const texture = new TextureLoader().load(localAsset("/sites/onde/silk.webp"), () => { if (!disposed) { loaded = true; wake(); } });
    const uniforms = {cloth:{value:texture}, viewport:{value:new Vector2()}, pointer:{value:target.clone()},
      time:{value:0}, chapter:{value:mood.current.chapter}, emphasis:{value:0}};
    const material = new ShaderMaterial({vertexShader:vertex, fragmentShader:fragment, uniforms, depthTest:false, depthWrite:false});
    const scene = new Scene();
    scene.add(new Mesh(geometry,material));
    const camera = new OrthographicCamera(-1,1,1,-1,0,1);
    function render(stamp: number) {
      frame = 0;
      if (disposed || failed || !loaded || document.hidden) return;
      if (!reduced.matches && stamp-last<31) { wake(); return; }
      const dt = Math.min((stamp-last)/1000,.075), damp = 1-Math.exp(-dt*6);
      last=stamp;
      elapsed+=reduced.matches ? 0 : dt;
      uniforms.pointer.value.lerp(target,damp);
      uniforms.time.value=elapsed;
      uniforms.chapter.value+=(mood.current.chapter-uniforms.chapter.value)*damp;
      uniforms.emphasis.value+=(Number(mood.current.held)-uniforms.emphasis.value)*damp;
      renderer.render(scene,camera);
      style.opacity="1";
      if (!reduced.matches) wake();
    }
    function wake() { if (!frame && loaded && !disposed && !failed && !document.hidden) frame=requestAnimationFrame(render); }
    function resize() {
      if (!host) return;
      const {width,height}=host.getBoundingClientRect();
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.35));
      renderer.setSize(width,height,false);
      uniforms.viewport.value.set(Math.max(width,1),Math.max(height,1));
      wake();
    }
    function move(e: PointerEvent) { if (!reduced.matches) target.set(e.clientX/innerWidth,1-e.clientY/innerHeight); }
    function lost(e: Event) { e.preventDefault(); failed=true; style.opacity="0"; cancelAnimationFrame(frame); frame=0; }
    function restored() { failed=false; wake(); }
    const ob=new ResizeObserver(resize);
    ob.observe(host); resize();
    renderer.domElement.addEventListener("webglcontextlost",lost);
    renderer.domElement.addEventListener("webglcontextrestored",restored);
    window.addEventListener("pointermove",move,{passive:true});
    document.addEventListener("visibilitychange",wake);
    reduced.addEventListener("change",wake);
    return () => {
      disposed=true; cancelAnimationFrame(frame); ob.disconnect();
      window.removeEventListener("pointermove",move); reduced.removeEventListener("change",wake);
      document.removeEventListener("visibilitychange",wake);
      renderer.domElement.removeEventListener("webglcontextlost",lost);
      renderer.domElement.removeEventListener("webglcontextrestored",restored);
      geometry.dispose(); material.dispose(); texture.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div ref={node} className="cloth-light" aria-hidden="true" />;
}
