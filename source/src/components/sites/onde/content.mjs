import { localAsset } from "./assets.mjs";
export const pieces = [
  {id:"lacune",title:"LACUNE",subtitle:"留白戒指",image:"/sites/onde/still.jpg",position:"50% 45%",thumbPosition:"50% 45%",color:"#d4d6d2",ink:"#252522",description:"一枚银色的环，在柔白的光里，留下未被填满的空间。",detail:"不规则的轮廓与勺面的弧线彼此映照，温柔与锋芒在这一刻相遇。",tone:261.63},
  {id:"liaison",title:"LIAISON",subtitle:"连缀链饰",image:"/sites/onde/links.jpg",position:"48% 45%",thumbPosition:"45% 48%",color:"#e5e5e3",ink:"#222",description:"不同的线条相遇，连缀成只属于自己的秩序。",detail:"金属、珍珠与纸面留下的痕迹，让日常的细节成为新的表达。",tone:329.63},
  {id:"galop",title:"GALOP",subtitle:"跃影吊坠",image:"/sites/onde/charm.jpg",position:"50% 48%",thumbPosition:"50% 48%",color:"#a61c12",ink:"#fff",description:"一点银光掠过热烈的红，轻盈的形状跃入眼帘。",detail:"小马的轮廓与折叠的锡箔，收藏这一季的想象与悸动。",tone:392},
  {id:"signal",title:"SIGNAL",subtitle:"来电戒指",image:"/sites/onde/signal.jpg",position:"58% 40%",thumbPosition:"57% 40%",color:"#53603e",ink:"#fff",description:"指尖轻触听筒，银色的纹理将日常变成一则讯息。",detail:"流动的金属线条包裹指节，光影随每一次动作悄然变化。",tone:293.66},
  {id:"pulse",title:"PULSE",subtitle:"脉冲手链",image:"/sites/onde/pulse.jpg",position:"50% 60%",thumbPosition:"50% 65%",color:"#6c2f2f",ink:"#fff",description:"一束光落在熟悉的物件上，平凡瞬间有了新的节奏。",detail:"三道细密光芒并行，如同从指尖发出的微弱脉冲。",tone:440}
].map(piece => ({...piece,image:localAsset(piece.image)}));
export const chapters = [
  ["lacune","liaison","galop"],
  ["signal","pulse"]
];
export const chapterNames = ["物与形", "日常信号"];
export const findPiece = id => pieces.find(piece => piece.id === id);
