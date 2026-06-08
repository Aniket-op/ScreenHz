import React, { useState, useEffect } from 'react';
import { useHz } from '../../lib/hz-detector';
import { usePollRate } from '../../lib/poll-rate';

export default function SetupScore() {
  const { hz } = useHz();
  const { pollRate } = usePollRate();
  const [reaction, setReaction] = useState<number|null>(null);
  const [phase, setPhase] = useState<'idle'|'wait'|'ready'|'done'>('idle');
  const [waiting, setWaiting] = useState(false);
  const waitStart = React.useRef(0);

  const startReaction = () => {
    setPhase('wait');
    const delay = 1500 + Math.random() * 2000;
    setTimeout(() => { setPhase('ready'); waitStart.current = performance.now(); }, delay);
  };

  const handleClick = () => {
    if (phase === 'ready') {
      const t = Math.round(performance.now() - waitStart.current);
      setReaction(t);
      setPhase('done');
    } else if (phase === 'wait') {
      setPhase('idle');
    }
  };

  const hzScore = Math.min(40, Math.round((hz / 360) * 40));
  const pollScore = Math.min(30, Math.round((Math.min(pollRate, 1000) / 1000) * 30));
  const reactScore = reaction ? Math.min(30, Math.max(0, Math.round((1 - (reaction - 150) / 350) * 30))) : 0;
  const total = hzScore + pollScore + reactScore;

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',alignItems:'center',justifyContent:'center',padding:40,gap:32}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontSize:96,fontFamily:"'IBM Plex Mono',monospace",color:'#ffffff',lineHeight:1}}>{total}<span style={{fontSize:32,color:'#555'}}> / 100</span></div>
      </div>
      <div style={{display:'flex',gap:32,fontFamily:"'IBM Plex Mono',monospace",fontSize:13}}>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Hz</div><div style={{color:'#e8e8e8'}}>{hz} <span style={{color:'#555'}}>+{hzScore}pts</span></div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Poll Rate</div><div style={{color:'#e8e8e8'}}>{pollRate}Hz <span style={{color:'#555'}}>+{pollScore}pts</span></div></div>
        <div style={{textAlign:'center'}}><div style={{color:'#555'}}>Reaction</div><div style={{color:'#e8e8e8'}}>{reaction||'—'}ms <span style={{color:'#555'}}>+{reactScore}pts</span></div></div>
      </div>
      {phase==='idle'&&<button onClick={startReaction} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Test Reaction Time</button>}
      {phase==='wait'&&<button onClick={handleClick} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Wait for signal...</button>}
      {phase==='ready'&&<button onClick={handleClick} style={{background:'#ffffff',border:'1px solid #fff',color:'#000',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer',fontWeight:'bold'}}>CLICK NOW!</button>}
      {phase==='done'&&<button onClick={startReaction} style={{background:'transparent',border:'1px solid #2a2a2a',color:'#555',padding:'8px 20px',fontFamily:"'IBM Plex Mono',monospace",fontSize:13,borderRadius:4,cursor:'pointer'}}>Run Again</button>}
    </div>
  );
}
