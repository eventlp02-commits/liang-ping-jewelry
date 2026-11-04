"use client";
import { lazy, Suspense, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { MoveHorizontal } from "lucide-react";
import { chapters, chapterNames, findPiece, pieces, type Piece } from "./content.mjs";
import { dragDestination } from "./choreography.mjs";
import { localAsset } from "./assets.mjs";

const ClothLight = lazy(() => import("./ClothLight").then(m=>({default:m.ClothLight})));
const roman=["I","II"];
export type Origin = {x:number;y:number};
type Props = {chapter:number; onChapter:(index:number)=>void; onPiece:(piece:Piece,origin:Origin)=>void; onNote:(tone:number)=>void};
export const objectFile=(id:string)=>localAsset(`/sites/onde/objects/${id}.webp`);
const finishes:Record<string,string>={lacune:"#77786f",liaison:"#909d99",galop:"#ac4332",signal:"#707c49",pulse:"#944c50"};

export function Gallery({chapter,onChapter,onPiece,onNote}:Props){
  const host=useRef<HTMLElement>(null), start=useRef<{x:number;y:number;pointer:number;capture:HTMLElement}|null>(null);
  const swallow=useRef(false);
  const [hovered,setHovered]=useState<string|null>(null);
  const [pressed,setPressed]=useState(false);
  const picked=hovered ? findPiece(hovered) : undefined;
  function hover(piece:Piece|null){
    setHovered(piece?.id ?? null);
    if(piece && hovered!==piece.id) onNote(piece.tone);
  }
  function select(index:number){setHovered(null);onChapter(index);}
  function pointerDown(e:ReactPointerEvent<HTMLElement>){
    if(e.button!==0 || !e.isPrimary || (e.target as HTMLElement).closest("nav")) return;
    start.current={x:e.clientX,y:e.clientY,pointer:e.pointerId,capture:e.currentTarget};swallow.current=false;
    setPressed(true);
  }
  function pointerMove(e:ReactPointerEvent<HTMLElement>){
    const el=host.current;if(!el) return;
    const x=e.clientX/Math.max(el.offsetWidth,1)-.5,y=e.clientY/Math.max(el.offsetHeight,1)-.5;
    el.style.setProperty("--mx",String(x));el.style.setProperty("--my",String(y));
    const g=start.current;if(!g || g.pointer!==e.pointerId)return;
    const dx=e.clientX-g.x,dy=e.clientY-g.y;
    if(Math.abs(dx)>14 && Math.abs(dx)>Math.abs(dy)*1.35){
      if(!g.capture.hasPointerCapture(e.pointerId))g.capture.setPointerCapture(e.pointerId);
      swallow.current=true;setHovered(null);
      el.dataset.dragging="true";
      const atEdge=(chapter===0&&dx>0)||(chapter===1&&dx<0);
      el.style.setProperty("--drag",`${dx*(atEdge ? .13 : .62)}px`);
    }
  }
  function finish(e:ReactPointerEvent<HTMLElement>,cancel=false){
    const g=start.current;if(!g || g.pointer!==e.pointerId)return;
    start.current=null;setPressed(false);
    if(g.capture.hasPointerCapture(e.pointerId))g.capture.releasePointerCapture(e.pointerId);
    if(host.current){delete host.current.dataset.dragging;host.current.style.setProperty("--drag","0px");}
    if(cancel)return;
    const next=dragDestination(chapter,e.clientX-g.x,e.clientY-g.y,innerWidth);
    if(next!==chapter){swallow.current=true;select(next);}
  }
  return <section ref={host} className="landing" data-chapter={chapter} aria-label="季度新品作品选择"
    onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={e=>finish(e)} onPointerCancel={e=>finish(e,true)}
    onPointerLeave={()=>{if(!start.current){setHovered(null);host.current?.style.setProperty("--mx","0");host.current?.style.setProperty("--my","0");}}}>
    <Suspense fallback={null}><ClothLight chapter={chapter} held={Boolean(hovered)||pressed}/></Suspense>
    <div className="light-bands" aria-hidden="true" style={{"--cast":picked ? finishes[picked.id] : "transparent",opacity:picked?.id ? .55 : 0} as CSSProperties}/>
    <div className="object-stage">
      {chapters.map((ids,c)=><div key={c} className="flight" data-shift={c-chapter} aria-hidden={c!==chapter} inert={c!==chapter}>
        {ids.map((id,i)=>{
          const piece=findPiece(id)!;
          const fig=String(pieces.indexOf(piece)+1).padStart(2,"0");
          return <button key={id} className="specimen" data-piece={id} aria-label={`查看 ${piece.title} ${piece.subtitle}`}
            style={{"--i":i,"--phase":`${-i*2.7}s`,"--finish":finishes[id]} as CSSProperties}
            onPointerEnter={e=>{if(e.pointerType==="mouse"&&!start.current)hover(piece);}}
            onPointerLeave={()=>hover(null)} onFocus={()=>hover(piece)} onBlur={()=>hover(null)}
            onClick={e=>{if(swallow.current){swallow.current=false;return;}
              const b=e.currentTarget.querySelector(".specimen-body")!.getBoundingClientRect();
              onPiece(piece,{x:b.left+b.width/2,y:b.top+b.height/2});}}>
            <span className="specimen-drift"><span className="specimen-body" style={{"--object":`url("${objectFile(id)}")`} as CSSProperties}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={objectFile(id)} alt="" draggable={false}/><i className="metal-glint"/>
            </span></span>
            <span className="specimen-label"><i>Fig. {fig}</i><span>{piece.title}</span></span>
          </button>;
        })}
      </div>)}
    </div>
    <nav className="chapter-switch" aria-label="选择章节">{chapters.map((_,i)=>
      <button key={i} aria-label={`第${i+1}章 ${chapterNames[i]}`} aria-current={i===chapter?"true":undefined} onClick={()=>select(i)}>{roman[i]}</button>)}</nav>
    <div className="landing-title"><div className="chapter-imprint" key={chapter}><span/>CHAPTER {roman[chapter]}<span/></div><h1>Liang Ping</h1>
      <p key={`caption-${chapter}`}>{chapterNames[chapter]}<b>·</b>季度新品</p></div>
    <div className="folio"><span>ÉDITION N°04</span><i/> <span>2026</span></div>
    <div className="swipe-sign" aria-hidden="true"><MoveHorizontal size={17} strokeWidth={1}/></div>
  </section>;
}
