/* Grid algorithms are intentionally DOM-free for reuse by a future server. */
(function(root){
  const Geometry = {
    key:(x,y)=>x+','+y,
    manhattan:(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y),
    inBounds:(x,y,size)=>x>=0&&x<size&&y>=0&&y<size,
    bfs(startX,startY,isBlocked,gridSize){
      const dist=new Map(), parent=new Map(), key=Geometry.key;
      dist.set(key(startX,startY),0); const queue=[[startX,startY]];
      const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
      for(let head=0;head<queue.length;head++){
        const [cx,cy]=queue[head], cd=dist.get(key(cx,cy));
        for(const [dx,dy] of dirs){ const nx=cx+dx,ny=cy+dy,k=key(nx,ny);
          if(!Geometry.inBounds(nx,ny,gridSize)||isBlocked(nx,ny)||dist.has(k)) continue;
          dist.set(k,cd+1); parent.set(k,key(cx,cy)); queue.push([nx,ny]);
        }
      } return {dist,parent};
    },
    reconstructPath(parent,startX,startY,targetX,targetY){
      const start=Geometry.key(startX,startY); let current=Geometry.key(targetX,targetY); const path=[];
      if(current!==start&&!parent.has(current)) return null;
      while(current!==start){ const [x,y]=current.split(',').map(Number); path.unshift({x,y}); current=parent.get(current); if(current===undefined)return null; }
      return path;
    },
    line(x0,y0,x1,y1){
      const cells=[]; let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy,x=x0,y=y0;
      while(true){ cells.push({x,y}); if(x===x1&&y===y1)break; const e2=2*err; if(e2>-dy){err-=dy;x+=sx;} if(e2<dx){err+=dx;y+=sy;} }
      return cells;
    },
    hasLineOfSight(from,to,isBlocked,inBounds){
      const cells=Geometry.line(from.x,from.y,to.x,to.y);
      return cells.slice(1,-1).every(c=>inBounds(c.x,c.y)&&!isBlocked(c.x,c.y));
    }
  };
  root.Geometry=Geometry; if(typeof module!=='undefined') module.exports=Geometry;
})(globalThis);

/* Compatibility façade for the existing UI controller. New rule code uses Geometry. */
function manhattan(a,b){ return Geometry.manhattan(a,b); }
function bfsGeneric(startX,startY,isBlocked,gridSize){ return Geometry.bfs(startX,startY,isBlocked,gridSize); }
function reconstructPath(parent,startX,startY,targetX,targetY){ return Geometry.reconstructPath(parent,startX,startY,targetX,targetY); }
function getLineCells(x0,y0,x1,y1){ return Geometry.line(x0,y0,x1,y1); }
