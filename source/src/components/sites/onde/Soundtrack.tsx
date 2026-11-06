"use client";
import { useImperativeHandle, useRef, useState, type Ref } from "react";
import { LoaderCircle, Volume2, VolumeX } from "lucide-react";
import { localAsset } from "./assets.mjs";

export type SoundtrackHandle={start:()=>void};

export function Soundtrack({ref}:{ref:Ref<SoundtrackHandle>}){
  const audio=useRef<HTMLAudioElement>(null), introduced=useRef(false);
  const [state,setState]=useState<"paused"|"loading"|"playing"|"error">("paused");
  const [volume,setVolume]=useState(.3);
  function play(){
    const track=audio.current!;
    track.volume=volume;
    setState("loading");
    void track.play().catch(error=>{
      if(error.name!=="AbortError")setState("error");
    });
  }
  useImperativeHandle(ref,()=>({
    start(){if(!introduced.current){introduced.current=true;play();}},
  }));
  const running=state==="playing"||state==="loading";
  const label=running?"暂停音乐":"播放音乐";
  return <div className="soundtrack" data-state={state}>
    <audio ref={audio} src={localAsset("/sites/onde/someone-in-the-crowd.mp3")} preload="none" loop
      onPlaying={()=>setState("playing")} onPause={()=>setState("paused")} onWaiting={()=>setState("loading")}
      onError={()=>setState("error")}/>
    <div className="sound-volume"><input aria-label="音乐音量" type="range" min="0" max="1" step=".01" value={volume}
      onChange={e=>{const level=Number(e.target.value);setVolume(level);audio.current!.volume=level;}}/></div>
    <button className="sound-control" aria-label={label} aria-pressed={running} title={state==="error"?"重试播放":label}
      onClick={()=>{introduced.current=true;if(running)audio.current!.pause();else play();}}>
      {state==="loading"?<LoaderCircle className="music-loading" size={18} strokeWidth={1.2}/>:
        running?<Volume2 size={19} strokeWidth={1.2}/>:<VolumeX size={19} strokeWidth={1.2}/>}
      <i className="waveform" aria-hidden="true">{[0,1,2,3,4].map(i=><b key={i} style={{animationDelay:`${-i*.22}s`}}/>)}</i>
    </button>
  </div>;
}
