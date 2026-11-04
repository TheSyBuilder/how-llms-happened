import '../i18n/preact';
import { useState } from "preact/hooks";
export const initialShapes = [true, false, true, false, true, false, false, false, true];
export function countVisibleCircles(shapes: boolean[], image: boolean, rows: number) {
  if (!image) return { min: 0, max: shapes.length, visible: 0 };
  const visible = Math.min(shapes.length, rows * 3);
  const min = shapes.slice(0, visible).filter(Boolean).length;
  return { min, max: min + shapes.length - visible, visible };
}
export default function VisionToy() {
  const [shapes, setShapes] = useState(initialShapes);
  const [sendImage, setSendImage] = useState(false);
  const [rows, setRows] = useState(3);
  const result = countVisibleCircles(shapes, sendImage, rows);
  const answer = !sendImage ? "I need the picture to count." : result.min === result.max ? `${result.min} circles.` : `${result.min}–${result.max} circles possible.`;
  return <div class="vision-toy">
    <div class="toy-topline"><strong>Give the question a picture.</strong><span class="toy-label">Toy · nine shapes</span></div>
    <p>Question: “How many circles are in this grid?” Tap any shape to change it.</p>
    <div class="chapter-answer" aria-live="polite"><span>Same question, different evidence</span><output data-testid="vision-answer">{answer}</output><p>{result.visible} of 9 cells visible. Hidden cells could be either shape.</p></div>
    <p class="image-side-label">Your picture · all nine cells</p><div class="shape-grid" aria-label="Editable picture">{shapes.map((circle, i) => <button aria-label={`Cell ${i + 1}: ${circle ? "circle" : "square"}; change shape`} onClick={() => setShapes(current => current.map((value, j) => i === j ? !value : value))}><svg viewBox="0 0 60 60" aria-hidden="true">{circle ? <circle cx="30" cy="30" r="19" /> : <rect x="12" y="12" width="36" height="36" />}</svg></button>)}</div>
    <label class="chapter-toggle"><input type="checkbox" checked={sendImage} onChange={e => setSendImage(e.currentTarget.checked)} />Send the image too</label>
    <div class="toy-controls"><label for="visible-rows">Rows visible to the reader <output for="visible-rows">{sendImage ? rows : 0} / 3</output></label><input id="visible-rows" type="range" min="1" max="3" value={rows} disabled={!sendImage} onInput={e => setRows(Number(e.currentTarget.value))} /></div>
    <div class="vision-received"><span>Reader’s picture · only the supplied cells</span><div class="received-grid" aria-label="Received image">{shapes.map((circle, i) => <span>{i < result.visible ? (circle ? "●" : "■") : "?"}</span>)}</div></div>
    <button class="another-continuation" onClick={() => { setShapes(initialShapes); setSendImage(false); setRows(3); }}>Reset picture</button>
    <details class="toy-method"><summary>About this toy</summary><p class="toy-footnote">A rule counts known shapes; it does not interpret pixels. No GPT-4 runs here. The cautious range is our teaching rule, not a promise about a real model’s answers.</p></details>
  </div>;
}
