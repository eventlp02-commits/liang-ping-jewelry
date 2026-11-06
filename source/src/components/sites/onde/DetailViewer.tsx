"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import Panzoom, {type PanzoomObject} from "@panzoom/panzoom";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import type { Piece } from "./content.mjs";

export function DetailViewer({piece,aspect,onClose}:{piece:Piece;aspect:number;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null),photo=useRef<HTMLImageElement>(null),view=useRef<HTMLDivElement>(null);
  const pan=useRef<PanzoomObject>(null);
  const [zoom,setZoom]=useState(1);
  useEffect(()=>{
    const d=dialog.current!,image=photo.current!,viewport=view.current!;
    const opener=document.activeElement as HTMLElement;
    d.showModal();
    const overflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const control=Panzoom(image,{minScale:1,maxScale:4,step:.5,contain:"outside",canvas:true,
      duration:matchMedia("(prefers-reduced-motion: reduce)").matches?0:240});
    pan.current=control;
    const changed=(event:Event)=>setZoom((event as CustomEvent<{scale:number}>).detail.scale);
    const doubleClick=()=>{if(control.getScale()>1.1)control.reset({contain:undefined});else control.zoom(2.5,{animate:true});};
    image.addEventListener("panzoomchange",changed);
    viewport.addEventListener("wheel",control.zoomWithWheel,{passive:false});
    viewport.addEventListener("dblclick",doubleClick);
    return()=>{
      control.destroy();image.removeEventListener("panzoomchange",changed);
      viewport.removeEventListener("wheel",control.zoomWithWheel);viewport.removeEventListener("dblclick",doubleClick);
      document.body.style.overflow=overflow;d.close();opener.focus({preventScroll:true});
    };
  },[]);
  // The original frame is already fitted; resetting must ignore in-flight zoom measurements.
  function reset(){pan.current!.reset({contain:undefined});}
  return <dialog ref={dialog} className="detail-viewer" data-zoomed={zoom>1.01?"true":"false"} aria-label="作品原图"
    onCancel={e=>{e.preventDefault();onClose();}}>
    <div ref={view} className="viewer-canvas">
      <div className="viewer-frame" style={{"--image-ratio":aspect} as CSSProperties}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={photo} src={piece.image} alt={piece.subtitle} draggable={false}/>
      </div>
    </div>
    <div className="viewer-heading"><span>{piece.title}</span><button aria-label="关闭原图" title="关闭原图" onClick={onClose}><X size={22} strokeWidth={1}/></button></div>
    <div className="viewer-tools">
      <button aria-label="缩小" title="缩小" disabled={zoom<=1.01} onClick={()=>pan.current!.zoomOut()}><Minus size={20} strokeWidth={1}/></button>
      <span aria-live="polite">{Math.round(zoom*100)}%</span>
      <button aria-label="放大" title="放大" disabled={zoom>=3.99} onClick={()=>pan.current!.zoomIn()}><Plus size={20} strokeWidth={1}/></button>
      <i/><button aria-label="还原" title="还原" onClick={reset}><RotateCcw size={17} strokeWidth={1}/></button>
    </div>
  </dialog>;
}
