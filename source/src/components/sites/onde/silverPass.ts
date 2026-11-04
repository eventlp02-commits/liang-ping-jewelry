import registrations from "./registrations.json";
import { localAsset } from "./assets.mjs";

const bounds:Record<string,number[]> = registrations;
const tagged = "travelling-silver";

function onTable(id:string){
  const img=document.querySelector<HTMLElement>(`.flight:not([inert]) [data-piece="${id}"] .specimen-body img`);
  if(img)img.style.viewTransitionName=tagged;
  return ()=>{if(img)img.style.viewTransitionName="";};
}
function inPhoto(id:string){
  const photo=document.querySelector<HTMLImageElement>(".story [data-framed] img");
  if(!photo?.naturalWidth||!bounds[id]||scrollY>3)return ()=>{};
  const [x,y,w,h]=bounds[id],rect=photo.getBoundingClientRect();
  const scale=rect.width/photo.naturalWidth;
  const layer=new Image();
  layer.src=localAsset(`/sites/onde/objects/${id}.webp`);
  layer.alt="";layer.setAttribute("aria-hidden","true");
  Object.assign(layer.style,{position:"fixed",pointerEvents:"none",zIndex:"10",maxWidth:"none",left:`${rect.left+x*scale}px`,
    top:`${rect.top+y*scale}px`,width:`${w*scale}px`,height:`${h*scale}px`,viewTransitionName:tagged});
  document.body.append(layer);
  return ()=>layer.remove();
}

// Both snapshots use the same photographed silver. The destination rectangle is
// measured after the story's own camera settles, not guessed from the viewport.
export function silverPass(from:string|null,to:string|null){
  const entry=from ? null : to, exit=to ? null : from;
  let clear=entry ? onTable(entry) : exit ? inPhoto(exit) : ()=>{};
  let ended=false;
  return {
    async arrive(){
      clear();if(ended)return;
      if(exit){clear=onTable(exit);return;}
      if(!entry)return;
      const image=document.querySelector<HTMLImageElement>(".story img");
      if(!image)return;
      await Promise.race([image.decode().catch(()=>{}),new Promise<void>(r=>setTimeout(r,550))]);
      // A view-transition update suspends rendering. Align synchronously here;
      // waiting for animation frames would deadlock the browser's capture.
      image.closest("[data-pinned]")?.querySelector(":scope > div")?.dispatchEvent(new Event("onde:register"));
      if(!ended)clear=inPhoto(entry);
    },
    close(){ended=true;clear();},
  };
}
