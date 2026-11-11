// "Break the counter": unseen drinks get probability zero (infinite surprise) until some probability is reserved for them.
export const drinks=['tea','coffee','cocoa','juice','water','milk'] as const;
export type Drink=typeof drinks[number];
export const counts:Record<Drink,number>={tea:6,coffee:3,cocoa:1,juice:0,water:0,milk:0};
export const seenTotal=10;
export const unseen=drinks.filter(d=>counts[d]===0);
export const ORDER_SIZE=3,CRASHES_NEEDED=3;
export const reserves=[.05,.15,.3,.5] as const;
// The regulars come back tonight and order exactly what the counter saw.
export const regulars:Drink[]=drinks.flatMap(d=>Array.from({length:counts[d]},()=>d));
// Seen drinks keep (1 − r) of their observed share; unseen drinks split r equally.
export function drinkProbability(drink:Drink,reserve:number):number {
 return counts[drink]?(1-reserve)*counts[drink]/seenTotal:reserve/unseen.length;
}
export function cupBits(drink:Drink,reserve:number):number {const p=drinkProbability(drink,reserve);return p>0?-Math.log2(p):Infinity;}
export function orderBits(order:readonly Drink[],reserve:number):number {return order.reduce((sum,d)=>sum+cupBits(d,reserve),0);}
export const crashes=(order:readonly Drink[])=>orderBits(order,0)===Infinity;
// Drinks are scored independently, so the same drinks in another order are the same order.
export const orderKey=(order:readonly Drink[])=>[...order].sort().join('+');
export function rescueTotals(orders:readonly (readonly Drink[])[]):{reserve:number;bits:number}[] {
 return reserves.map(reserve=>({reserve,bits:orders.reduce((sum,o)=>sum+orderBits(o,reserve),orderBits(regulars,reserve))}));
}
export function unseenCups(orders:readonly (readonly Drink[])[]):number {return orders.flat().filter(d=>counts[d]===0).length;}
export function zeroStars(pick:number,orders:readonly (readonly Drink[])[]):0|1|2|3 {
 const ranked=rescueTotals(orders).sort((a,b)=>a.bits-b.bits).map(t=>t.reserve);
 const place=ranked.indexOf(pick);
 return place===0?3:place===1?2:place<0?0:1;
}
