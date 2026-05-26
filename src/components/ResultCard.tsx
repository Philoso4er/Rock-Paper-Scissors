import React from 'react';
import { EmojiType, TEAM_COLORS, EMOJI_MAP } from '../types';
import MoodFace from './MoodFace';
import { motion } from 'motion/react';

interface ResultCardProps {
  winner: EmojiType | 'draw';
  duration: number;
  finalCounts: Record<EmojiType, number>;
  initialCounts: Record<EmojiType, number>;
  lowestCounts: Record<EmojiType, number>;
  totalConversions: number;
  chosenAlliance: EmojiType | null;
  coins: number;
  lastBet: number;
  betWon: boolean;
  onPlayAgain: () => void;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function buildCommentary(
  winner: EmojiType | 'draw',
  duration: number,
  finalCounts: Record<EmojiType, number>,
  initialCounts: Record<EmojiType, number>,
  lowestCounts: Record<EmojiType, number>,
  totalConversions: number,
  chosenAlliance: EmojiType | null,
): string {
  if (winner === 'draw') return "A draw. The battlefield fell silent with no clear victor. A rare and humbling outcome.";
  const winEmoji = EMOJI_MAP[winner];
  const winName  = winner.charAt(0).toUpperCase() + winner.slice(1);
  const total    = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const winLow   = lowestCounts[winner];
  const winInit  = initialCounts[winner];
  const winFinal = finalCounts[winner];
  const mins     = duration / 60;
  const wasComeback   = winLow / winInit < 0.35;
  const wasDomination = winLow / winInit > 0.75 && winFinal / total > 0.9;
  const allyWon  = chosenAlliance === winner;
  const allyLost = chosenAlliance !== null && chosenAlliance !== winner;
  const pace     = mins < 0.5 ? 'lightning-fast' : mins < 1.5 ? 'brisk' : mins < 3 ? 'hard-fought' : 'epic';

  let line = '';
  if (wasComeback) {
    line = `${winEmoji} ${winName} pulled off an INSANE comeback — down to just ${winLow} units before storming back to take the entire battlefield in ${fmt(duration)}.`;
  } else if (wasDomination) {
    line = `${winEmoji} ${winName} steamrolled the competition in ${fmt(duration)}. A dominant, clinical performance. ${totalConversions} conversions. No contest.`;
  } else {
    line = `A ${pace} battle. ${winEmoji} ${winName} outlasted the competition in ${fmt(duration)} after ${totalConversions} total conversions across the field.`;
  }
  if (allyWon)  line += ' YOUR team won. You called it.';
  if (allyLost) line += ` Your ${chosenAlliance} squad didn't make it. Better luck next round.`;
  return line;
}

function downloadResultImage(
  winner: EmojiType | 'draw', duration: number,
  initialCounts: Record<EmojiType, number>,
  lowestCounts: Record<EmojiType, number>,
  totalConversions: number, commentary: string,
  lastBet: number, betWon: boolean,
) {
  const W = 640, H = 380;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const col = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af' };

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0a0a14');
  grad.addColorStop(1, winner !== 'draw' ? `${col.primary}44` : '#1a1a2e');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

  const radial = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.55);
  radial.addColorStop(0, `${col.primary}22`); radial.addColorStop(1, 'transparent');
  ctx.fillStyle = radial; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = col.primary; ctx.fillRect(0, 0, W, 4);
  ctx.font = '76px serif'; ctx.textAlign = 'center';
  ctx.fillText(winner !== 'draw' ? EMOJI_MAP[winner] : '🤝', W/2, 98);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText(winner !== 'draw' ? `${winner.toUpperCase()} WINS` : "IT'S A DRAW", W/2, 138);

  ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.font = '13px Arial';
  const words = commentary.split(' ');
  let line = '', y = 166;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > W - 80 && line) {
      ctx.fillText(line, W/2, y); line = w; y += 19;
    } else line = test;
  }
  if (line) ctx.fillText(line, W/2, y);
  y += 28;

  const total = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const stats = [
    { label: 'Duration',     value: fmt(duration) },
    { label: 'Conversions',  value: `${totalConversions}` },
    { label: 'Total Units',  value: `${total}` },
    { label: 'Lowest Point', value: winner !== 'draw' ? `${lowestCounts[winner]}` : '—' },
    ...(lastBet > 0 ? [{ label: 'Bet Result', value: betWon ? `+${Math.floor(lastBet*1.9)} 🪙` : `-${lastBet} 🪙` }] : []),
  ];

  const boxW = lastBet > 0 ? 110 : 130;
  const gap = 10;
  const startX = (W - (stats.length * boxW + (stats.length-1) * gap)) / 2;
  stats.forEach((s, i) => {
    const bx = startX + i * (boxW + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(bx, y, boxW, 50, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.font = '9px Arial';
    ctx.fillText(s.label.toUpperCase(), bx + boxW/2, y + 14);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 15px Georgia, serif';
    ctx.fillText(s.value, bx + boxW/2, y + 34);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.font = '10px Arial';
  ctx.fillText('RPS Battle Simulation', W/2, H - 12);

  const link = document.createElement('a');
  link.download = `rps-battle-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

const ResultCard: React.FC<ResultCardProps> = ({
  winner, duration, finalCounts, initialCounts,
  lowestCounts, totalConversions, chosenAlliance,
  coins, lastBet, betWon, onPlayAgain,
}) => {
  const col = winner !== 'draw' ? TEAM_COLORS[winner] : { primary: '#6b7280', glow: '#9ca3af', text: '#f3f4f6' };
  const total = initialCounts.rock + initialCounts.paper + initialCounts.scissors;
  const wasComeback = winner !== 'draw' && lowestCounts[winner] / initialCounts[winner] < 0.35;
  const commentary = buildCommentary(winner, duration, finalCounts, initialCounts, lowestCounts, totalConversions, chosenAlliance);
  const isWinner = winner !== 'draw' && chosenAlliance === winner;
  const isLoser  = winner !== 'draw' && chosenAlliance !== null && chosenAlliance !== winner;
  const payout = Math.floor(lastBet * 1.9);

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.78)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100, padding:20 }}
    >
      <motion.div
        initial={{ scale:0.85, y:30, opacity:0 }} animate={{ scale:1, y:0, opacity:1 }}
        transition={{ type:'spring', stiffness:220, damping:22 }}
        style={{ background:`linear-gradient(145deg, rgba(5,5,15,0.97), ${col.primary}28)`, border:`1.5px solid ${col.glow}44`, boxShadow:`0 0 70px ${col.glow}28`, borderRadius:20, padding:'32px 28px 24px', maxWidth:420, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', gap:14, position:'relative', overflow:'hidden' }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:col.primary }}/>
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:300, height:300, background:`radial-gradient(circle, ${col.primary}28 0%, transparent 68%)`, pointerEvents:'none' }}/>

        {winner !== 'draw' ? (
          <motion.div animate={{ y:[0,-7,0] }} transition={{ repeat:Infinity, duration:2.4, ease:'easeInOut' }}>
            <MoodFace type={winner} mood="dominant" size={86}/>
          </motion.div>
        ) : <div style={{ fontSize:58 }}>🤝</div>}

        <div style={{ fontFamily:'Georgia, serif', fontSize:26, fontWeight:700, color:'#fff', letterSpacing:'0.06em', textAlign:'center' }}>
          {winner === 'draw' ? "IT'S A DRAW" : `${winner.toUpperCase()} WINS`}
        </div>

        {/* Alliance result */}
        {chosenAlliance && (
          <div style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color: isWinner ? '#4ade80' : isLoser ? '#f87171' : 'rgba(255,255,255,0.5)', background: isWinner ? '#4ade8018' : isLoser ? '#f8717118' : 'transparent', padding:'4px 14px', borderRadius:20, border: isWinner ? '1px solid #4ade8044' : isLoser ? '1px solid #f8717144' : 'none' }}>
            {isWinner ? '🏆 Your team won!' : isLoser ? '💀 Your team lost' : ''}
          </div>
        )}

        {/* Coin result */}
        {lastBet > 0 && (
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.3, type:'spring' }}
            style={{ display:'flex', alignItems:'center', gap:8, background: betWon ? '#4ade8018' : '#f8717118', border:`1px solid ${betWon ? '#4ade8044' : '#f8717144'}`, borderRadius:12, padding:'8px 18px' }}
          >
            <span style={{ fontSize:20 }}>🪙</span>
            <div>
              <div style={{ fontSize:14, fontWeight:700, color: betWon ? '#4ade80' : '#f87171' }}>
                {betWon ? `+${payout} coins` : `-${lastBet} coins`}
              </div>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.4)', letterSpacing:'0.08em' }}>
                BALANCE: {coins.toLocaleString()} 🪙
              </div>
            </div>
          </motion.div>
        )}

        <div style={{ fontSize:13, color:'rgba(255,255,255,0.7)', textAlign:'center', lineHeight:1.7, fontStyle:'italic', padding:'0 4px' }}>
          "{commentary}"
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, width:'100%' }}>
          {[
            { label:'Duration',     value: fmt(duration)                                            },
            { label:'Conversions',  value: `${totalConversions}`                                    },
            { label:'Total Units',  value: `${total}`                                               },
            { label:'Lowest Point', value: winner !== 'draw' ? `${lowestCounts[winner]} units` : '—'},
          ].map(s => (
            <div key={s.label} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,0.38)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:15, fontWeight:700, color:'#fff', fontFamily:'Georgia, serif' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {wasComeback && (
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:0.5, type:'spring' }}
            style={{ fontSize:12, fontWeight:700, letterSpacing:'0.1em', color:'#fbbf24', textTransform:'uppercase', background:'#fbbf2418', border:'1px solid #fbbf2440', padding:'5px 18px', borderRadius:20 }}>
            ⚡ COMEBACK OF THE CENTURY
          </motion.div>
        )}

        <div style={{ display:'flex', gap:8, width:'100%' }}>
          <button onClick={() => downloadResultImage(winner, duration, initialCounts, lowestCounts, totalConversions, commentary, lastBet, betWon)}
            style={{ flex:1, padding:'11px 0', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', borderRadius:10, color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            💾 Save
          </button>
          <button onClick={() => {
            const text = `${commentary}\n\nRPS Battle Simulation`;
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
          }}
            style={{ flex:1, padding:'11px 0', background:'rgba(29,161,242,0.12)', border:'1px solid rgba(29,161,242,0.25)', borderRadius:10, color:'#1da1f2', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            𝕏 Tweet
          </button>
          <button onClick={onPlayAgain}
            style={{ flex:2, padding:'11px 0', background:col.primary, border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', letterSpacing:'0.08em', textTransform:'uppercase', boxShadow:`0 0 22px ${col.primary}77` }}>
            Play Again
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ResultCard;
