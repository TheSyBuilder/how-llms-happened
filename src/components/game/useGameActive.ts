import type {RefObject} from 'preact';
import {useEffect,useState} from 'preact/hooks';

function isRendered(root:Element):boolean {
 if(!root.isConnected)return false;
 if(typeof root.checkVisibility==='function')return root.checkVisibility();
 for(let node:Element|null=root;node;node=node.parentElement)if(getComputedStyle(node).display==='none')return false;
 return true;
}
// A dialog that hosts the game does not cover it; any other open dialog does.
export function isGameActive(root:Element|null):boolean {
 if(!root||!isRendered(root))return false;
 const page=root.ownerDocument;
 if(page.visibilityState!=='visible')return false;
 for(const dialog of page.querySelectorAll('dialog[open]'))if(!root.contains(dialog)&&!dialog.contains(root))return false;
 return true;
}
const editable='input,textarea,select,[contenteditable]:not([contenteditable="false"]),[role="textbox"],[role="searchbox"],[role="combobox"]';
// Keys go to the focused element, so a target outside the game other than the page itself is another control.
export function ownsGameKey(root:Element|null,event:KeyboardEvent):boolean {
 if(!root||!isGameActive(root))return false;
 const target=event.target as Node|null;
 if(target?.nodeType!==1)return true;
 const element=target as HTMLElement,page=root.ownerDocument;
 if(element===page.body||element===page.documentElement)return true;
 if(element.isContentEditable||element.closest(editable))return false;
 const dialog=element.closest('dialog[open]');
 if(dialog&&!dialog.contains(root))return false;
 return root.contains(element);
}
export function useGameActive(root:RefObject<Element>):boolean {
 const [active,setActive]=useState(true);
 // Re-read after each render too, because a game can attach its root after loading data.
 useEffect(()=>{if(root.current)setActive(isGameActive(root.current));});
 useEffect(()=>{
  const update=()=>{if(root.current)setActive(isGameActive(root.current));};
  // `open` covers every way a dialog opens or closes. `data-view` catches the chapter view
  // changing even if this hook's hashchange listener runs before the page's.
  const observer=new MutationObserver(update);
  observer.observe(document.documentElement,{subtree:true,attributes:true,attributeFilter:['open','data-view']});
  window.addEventListener('hashchange',update);
  document.addEventListener('visibilitychange',update);
  return ()=>{
   observer.disconnect();
   window.removeEventListener('hashchange',update);
   document.removeEventListener('visibilitychange',update);
  };
 },[root]);
 return active;
}
