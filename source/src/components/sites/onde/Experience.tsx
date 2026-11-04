"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import { ArrowRight, Menu, X } from "lucide-react";
import { chapters, chapterNames, findPiece, pieces, type Piece } from "./content.mjs";
import { locate, wipeRadius } from "./choreography.mjs";
import { Gallery, objectFile, type Origin } from "./Gallery";
import { MaterialStudy } from "./MaterialStudy";
import { silverPass } from "./silverPass";

const roman=["I","II"];
const motionOff=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;

function note(ctx:AudioContext, hz:number){
  const now=ctx.currentTime;
  [1,2.01,3.98].forEach((harmonic,i)=>{
    const oscillator=ctx.createOscillator(), gain=ctx.createGain();
    oscillator.frequency.value=hz*harmonic;
    gain.gain.setValueAtTime(.0001,now);
    gain.gain.exponentialRampToValueAtTime(.035/(i+1)**2,now+.018);
    gain.gain.exponentialRampToValueAtTime(.0001,now+1.55-i*.25);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
    oscillator.start(now);oscillator.stop(now+1.6);
  });
}

export function Experience(){
  const [route,setRoute]=useState({chapter:0,id:null} as ReturnType<typeof locate>);
  const [menu,setMenu]=useState(false),[sound,setSound]=useState(false);
  const current=useRef(route), origin=useRef<Origin|null>(null), transition=useRef<ViewTransition|null>(null);
  const dialog=useRef<HTMLDialogElement>(null), menuButton=useRef<HTMLButtonElement>(null);
  const audio=useRef<AudioContext|null>(null), lastNote=useRef(0), generation=useRef(0);
  const active=route.id ? findPiece(route.id) : undefined;
  const next=active ? pieces[(pieces.indexOf(active)+1)%pieces.length] : null;
  const navigate=useCallback((hash:string,write=true,point?:Origin,animate=true)=>{
    const target=locate(hash),from=current.current;
    const same=from.chapter===target.chapter && from.id===target.id;
    const sequence=++generation.current;
    transition.current?.skipTransition();
    const root=document.documentElement;
    const setPoint=(p:Origin)=>{
      root.style.setProperty("--wipe-x",`${p.x}px`);root.style.setProperty("--wipe-y",`${p.y}px`);
      root.style.setProperty("--wipe-r",`${wipeRadius(p.x,p.y,innerWidth,innerHeight)}px`);
    };
    const commit=()=>{
      if(sequence!==generation.current)return;
      current.current=target;
      if(write&&location.hash!==hash) history.pushState(null,"",hash);
      flushSync(()=>{setMenu(false);setRoute(target);});
      window.scrollTo({top:0,behavior:"instant"});
      if(!target.id&&from.id){
        const button=document.querySelector<HTMLButtonElement>(`[data-piece="${from.id}"]`);
        const b=button?.querySelector(".specimen-body")?.getBoundingClientRect();
        if(b)setPoint({x:b.left+b.width/2,y:b.top+b.height/2});
        button?.focus({preventScroll:true});
      }else if(target.id) document.querySelector<HTMLElement>(".story")?.focus({preventScroll:true});
    };
    if(!animate || same || (!target.id && !from.id) || motionOff()){commit();return;}
    if(point)origin.current=point;
    setPoint(point??origin.current??{x:innerWidth*.5,y:innerHeight*.43});
    if(!document.startViewTransition){
      commit();
      document.querySelector(target.id?".story":".landing")?.animate(
        [{opacity:.25,transform:"translateY(9px)"},{opacity:1,transform:"none"}],
        {duration:430,easing:"cubic-bezier(.22,.72,.16,1)"});
      return;
    }
    root.dataset.flight=target.id ? "in" : "out";
    const silver=silverPass(from.id,target.id);
    const flight=document.startViewTransition(async()=>{commit();if(sequence===generation.current)await silver.arrive();});
    transition.current=flight;
    const finish=()=>{silver.close();if(transition.current===flight){transition.current=null;delete root.dataset.flight;}};
    void flight.finished.then(finish,finish);
  },[]);

  useEffect(()=>{
    const initial=window.setTimeout(()=>navigate(location.hash,false,undefined,false),0);
    const resume=()=>navigate(location.hash,false);
    window.addEventListener("hashchange",resume);
    return()=>{clearTimeout(initial);window.removeEventListener("hashchange",resume);};
  },[navigate]);
  useEffect(()=>{
    if(!menu || !dialog.current)return;
    const d=dialog.current;d.showModal();const overflow=document.body.style.overflow;document.body.style.overflow="hidden";
    return()=>{d.close();document.body.style.overflow=overflow;};
  },[menu]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(menu || event.altKey || event.metaKey || event.ctrlKey)return;
      if(event.key==="Escape" && active)navigate(`#chapter-${route.chapter+1}`);
      if(!active && (event.key==="ArrowLeft" || event.key==="ArrowRight")){
        event.preventDefault();navigate(`#chapter-${event.key==="ArrowRight"?2:1}`);
      }
    };
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[route.chapter,active,menu,navigate]);
  useEffect(()=>()=>{if(audio.current)void audio.current.close();},[]);
  function play(tone:number){
    const now=performance.now();
    if(sound && audio.current?.state==="running" && now-lastNote.current>150){lastNote.current=now;note(audio.current,tone);}
  }
  async function toggleSound(){
    try{
      if(sound){if(audio.current) await audio.current.suspend();setSound(false);return;}
      audio.current??=new AudioContext();await audio.current.resume();setSound(true);note(audio.current,active?.tone??261.63);
    }catch{setSound(false);}
  }
  function choose(piece:Piece,point?:Origin){play(piece.tone);navigate(`#${piece.id}`,true,point);}
  function closeMenu(){setMenu(false);requestAnimationFrame(()=>menuButton.current?.focus({preventScroll:true}));}
  return <main className={active ? "is-story" : "is-home"}>
    <header className="site-header"><button ref={menuButton} className="menu-toggle" aria-label="打开目录" aria-haspopup="dialog" aria-expanded={menu}
      onClick={()=>setMenu(true)}><Menu size={19} strokeWidth={1.1}/><span>MENU</span></button>
      <button className="wordmark" aria-label="Atelier Onde，返回章节" onClick={()=>navigate(`#chapter-${route.chapter+1}`)}>Atelier Onde</button>
      {active ? <button className="close-story" aria-label="关闭作品" onClick={()=>navigate(`#chapter-${route.chapter+1}`)}><X size={21} strokeWidth={1.1}/></button>
       : <span className="season">QUARTERLY COLLECTION</span>}
    </header>
    {!active ? <Gallery chapter={route.chapter} onChapter={i=>navigate(`#chapter-${i+1}`)} onPiece={choose} onNote={play}/>
      : <article key={active.id} className="story" tabIndex={-1} aria-label={active.subtitle} style={{"--story-color":active.color} as CSSProperties}>
        <MaterialStudy piece={active}/>
        {next && <button className="next-story" onClick={e=>choose(next,{x:e.clientX||innerWidth*.5,y:e.clientY||innerHeight*.5})}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={next.image} alt="" loading="lazy" style={{objectPosition:next.thumbPosition}}/>
          <span className="next-meta">NEXT OBJECT <i/> {String(pieces.indexOf(next)+1).padStart(2,"0")} / 05</span>
          <strong>{next.title}</strong><span>{next.subtitle} <ArrowRight size={23} strokeWidth={1}/></span></button>}
        <section className="collection-end" aria-labelledby="collection-title">
          <div className="collection-end-heading"><span>ATELIER ONDE &nbsp; / &nbsp; ÉDITION N°04</span><h2 id="collection-title">日常回响</h2><p>五件作品，五次与日常的相遇。</p></div>
          <div className="collection-grid">{pieces.map(piece=><button key={piece.id} aria-label={`查看 ${piece.title}`} onClick={e=>choose(piece,{x:e.clientX||innerWidth*.5,y:e.clientY||innerHeight*.5})}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={piece.image} alt="" loading="lazy" style={{objectPosition:piece.thumbPosition}}/>
            <strong>{piece.title}</strong><span>{piece.subtitle}</span></button>)}</div>
          <button className="back-collection" onClick={()=>navigate("#chapter-1")}>返回作品展台 <ArrowRight size={17} strokeWidth={1}/></button>
        </section></article>}
    <button className="sound-control" aria-pressed={sound} aria-label={sound?"关闭声音":"开启声音"} onClick={toggleSound}>
      <i className="waveform" aria-hidden="true">{[0,1,2,3,4].map(i=><b key={i} style={{"--i":i} as CSSProperties}/>)}</i>SOUND <span>{sound?"ON":"OFF"}</span></button>
    {menu && <dialog ref={dialog} className="menu-layer" aria-label="系列目录" onCancel={e=>{e.preventDefault();closeMenu();}} onClick={e=>{if(e.target===e.currentTarget)closeMenu();}}>
      <aside className="drawer"><button className="drawer-close" onClick={closeMenu}><X size={18} strokeWidth={1}/><span>CLOSE</span></button>
        <div className="drawer-content"><span className="drawer-edition">INDEX &nbsp; / &nbsp; ÉDITION N°04</span><div className="drawer-title">Liang Ping</div>
          {chapters.map((ids,c)=><section className="drawer-chapter" key={c}><h2>Chapter {roman[c]} <span>{chapterNames[c]}</span></h2>
            {ids.map(id=>{const piece=findPiece(id)!;return <button className="drawer-item" key={id} onClick={()=>choose(piece)} aria-label={`查看 ${piece.title} ${piece.subtitle}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={objectFile(id)} alt=""/><span><b>{piece.title}</b><small>{piece.subtitle}</small></span><ArrowRight size={16} strokeWidth={1}/></button>;})}
          </section>)}</div></aside></dialog>}
  </main>;
}
