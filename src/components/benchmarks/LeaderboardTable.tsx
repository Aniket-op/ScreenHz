import React, { useState } from 'react';

const MOCK_DATA = [
  {rank:1,name:'ProGamer2k',reaction:142,hz:360,poll:8000,score:98},
  {rank:2,name:'DisplayNerd',reaction:158,hz:240,poll:1000,score:94},
  {rank:3,name:'RefreshKing',reaction:167,hz:144,poll:1000,score:89},
  {rank:4,name:'xXMonitorXx',reaction:182,hz:165,poll:500,score:85},
  {rank:5,name:'Hz_Hunter',reaction:195,hz:144,poll:1000,score:82},
  {rank:6,name:'PixelWatcher',reaction:201,hz:120,poll:1000,score:78},
  {rank:7,name:'FrameDropper',reaction:215,hz:75,poll:125,score:65},
  {rank:8,name:'SmoothBoi',reaction:188,hz:165,poll:1000,score:86},
  {rank:9,name:'CRTLover',reaction:240,hz:60,poll:125,score:52},
  {rank:10,name:'GenericUser',reaction:300,hz:60,poll:125,score:40},
];

type SortKey = 'rank'|'reaction'|'hz'|'poll'|'score';

export default function LeaderboardTable() {
  const [sortKey, setSortKey] = useState<SortKey>('rank');
  const [sortAsc, setSortAsc] = useState(true);
  const [hzFilter, setHzFilter] = useState(0);

  const handleSort=(key:SortKey)=>{if(sortKey===key) setSortAsc(a=>!a); else{setSortKey(key);setSortAsc(true);}};
  const filtered=MOCK_DATA.filter(d=>hzFilter===0||d.hz>=hzFilter);
  const sorted=[...filtered].sort((a,b)=>sortAsc?(a[sortKey] as number)-(b[sortKey] as number):(b[sortKey] as number)-(a[sortKey] as number));

  const th=(key:SortKey,label:string)=>(
    <th onClick={()=>handleSort(key)} style={{padding:'8px 12px',cursor:'pointer',color:sortKey===key?'#e8e8e8':'#555',fontWeight:400,textAlign:'left',borderBottom:'1px solid #222',whiteSpace:'nowrap'}}>
      {label}{sortKey===key?(sortAsc?' ↑':' ↓'):''}
    </th>
  );

  return (
    <div style={{padding:24,fontFamily:"'IBM Plex Mono',monospace"}}>
      <div style={{display:'flex',gap:16,marginBottom:24,alignItems:'center'}}>
        <label style={{color:'#555',fontSize:11}}>FILTER Hz ≥</label>
        <select value={hzFilter} onChange={e=>setHzFilter(+e.target.value)} style={{background:'#0c0c0c',border:'1px solid #2a2a2a',color:'#e8e8e8',padding:'4px 8px',fontFamily:"'IBM Plex Mono',monospace"}}>
          <option value={0}>All</option>
          {[60,120,144,165,240,360].map(n=><option key={n} value={n}>{n}Hz+</option>)}
        </select>
        <span style={{color:'#555',fontSize:11,marginLeft:'auto'}}>Your rank: <span style={{color:'#e8e8e8'}}>#47</span> · Score: <span style={{color:'#e8e8e8'}}>87</span></span>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
        <thead>
          <tr style={{background:'#111'}}>
            {th('rank','#')}
            <th style={{padding:'8px 12px',color:'#555',fontWeight:400,textAlign:'left',borderBottom:'1px solid #222'}}>Name</th>
            {th('reaction','Reaction')}
            {th('hz','Hz')}
            {th('poll','Poll Rate')}
            {th('score','Score')}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row,i)=>(
            <tr key={row.rank} style={{background:i%2===0?'#0c0c0c':'#111'}}>
              <td style={{padding:'8px 12px',color:'#555'}}>{row.rank}</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.name}</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.reaction}ms</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.hz}Hz</td>
              <td style={{padding:'8px 12px',color:'#e8e8e8'}}>{row.poll}Hz</td>
              <td style={{padding:'8px 12px',color:'#ffffff',fontWeight:'bold'}}>{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
