// Initialize Mermaid with safer settings
window.addEventListener("DOMContentLoaded", () => {
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'dark'
    });
});

// ------------------------------------------------------------
//  GLOBAL STATE & ALGORITHM (UPDATED Jacobsthal)
// ------------------------------------------------------------
let comparisonCount = 0;

function lessThanWithCount(a, b) {
    comparisonCount++;
    return a < b;
}

// 1) createWinnerLoserPairs
function createWinnerLoserPairs(vec) {
    let pairs = [];
    for (let i = 0; i + 1 < vec.length; i += 2) {
        let p = {};
        if (lessThanWithCount(vec[i], vec[i + 1])) {
            p.winner = vec[i + 1];
            p.loser = vec[i];
        } else {
            p.winner = vec[i];
            p.loser = vec[i + 1];
        }
        pairs.push({ winner: p.winner, loser: p.loser });
    }
    return pairs;
}

// 2) extractStraggler
function extractStraggler(vec) {
    return vec.length % 2 ? vec[vec.length - 1] : -1;
}

// 3) extractWinners
function extractWinners(pairs) {
    let winners = [];
    for (let i = 0; i < pairs.length; i++) winners.push(pairs[i].winner);
    return winners;
}

// 4) orderPairsByWinners
function orderPairsByWinners(pairs, sortedWinners) {
    let orderedPairs = [];
    for (let i = 0; i < sortedWinners.length; i++) {
        for (let j = 0; j < pairs.length; j++) {
            if (pairs[j].winner === sortedWinners[i]) {
                orderedPairs.push({ winner: pairs[j].winner, loser: pairs[j].loser });
                pairs[j].winner = -1;
                break;
            }
        }
    }
    return orderedPairs;
}

// 5) buildInitialChain
function buildInitialChain(orderedPairs, totalSize) {
    let chain = [];
    chain.push(orderedPairs[0].loser);
    for (let i = 0; i < orderedPairs.length; i++) chain.push(orderedPairs[i].winner);
    return chain;
}

// 6) initializeInsertionBounds
function initializeInsertionBounds(numberOfPairs) {
    let bounds = [];
    for (let i = 0; i < numberOfPairs; i++) bounds.push(i + 1);
    return bounds;
}

// 7) generateJacobsthalNumbersUpTo (UPDATED: starts with [1,3])
function generateJacobsthalNumbersUpTo(jacobsthalArray, limit) {
    while (jacobsthalArray[jacobsthalArray.length - 1] < limit) {
        let next = jacobsthalArray[jacobsthalArray.length - 1] + 2 * jacobsthalArray[jacobsthalArray.length - 2];
        jacobsthalArray.push(next);
    }
}

// 8) generateInsertionOrder (UPDATED – matches new C++ version)
function generateInsertionOrder(pendingCount) {
    let insertionOrder = [];
    if (pendingCount === 0) return insertionOrder;
    
    let jacobsthal = [1, 3];  // start with 1,3 (index 0 and 1)
    generateJacobsthalNumbersUpTo(jacobsthal, pendingCount);
    
    let used = new Array(pendingCount).fill(false);
    
    for (let k = 1; k < jacobsthal.length; k++) {
        let start = jacobsthal[k];
        let end = jacobsthal[k - 1];
        for (let i = start; i > end; i--) {
            let idx = i - 2;
            if (idx >= 0 && idx < pendingCount && !used[idx]) {
                insertionOrder.push(idx);
                used[idx] = true;
            }
        }
    }
    
    for (let i = 0; i < pendingCount; i++) {
        if (!used[i]) insertionOrder.push(i);
    }
    return insertionOrder;
}

// 9) lowerBound
function lowerBound(arr, val, left, right, comp) {
    let lo = left, hi = right;
    while (lo < hi) {
        let mid = Math.floor((lo + hi) / 2);
        if (comp(arr[mid], val)) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

// 10) insertPendingElements
function insertPendingElements(insertionOrder, orderedPairs, chain, insertionBounds, straggler) {
    for (let step = 0; step < insertionOrder.length; step++) {
        let value, searchLimit;
        if (insertionOrder[step] === orderedPairs.length - 1 && straggler !== -1) {
            value = straggler;
            searchLimit = chain.length;
        } else {
            let idx = insertionOrder[step] + 1;
            value = orderedPairs[idx].loser;
            searchLimit = insertionBounds[idx];
        }
        let insertIndex = lowerBound(chain, value, 0, searchLimit, lessThanWithCount);
        chain.splice(insertIndex, 0, value);
        for (let i = 0; i < insertionBounds.length; i++) {
            if (insertionBounds[i] >= insertIndex) insertionBounds[i]++;
        }
    }
}

// ------------------------------------------------------------
//  RECURSIVE SORT – fordJohnsonSort
// ------------------------------------------------------------
function fordJohnsonSort(vec, depth = 0, stepRecorder = null, frameIdCounter = { id: 0 }) {
    let frameId = ++frameIdCounter.id;
    let frame = {
        id: frameId,
        depth: depth,
        name: 'fordJohnsonSort',
        params: { v: deepCopy(vec) },
        locals: {}
    };
    if (stepRecorder) stepRecorder.callStack.push(frame);
    if (stepRecorder) stepRecorder.record('enter', frame, vec, null, null, depth);

    if (vec.length === 1) {
        if (stepRecorder) stepRecorder.record('base case (size=1)', frame, vec, null, null, depth);
        if (stepRecorder) stepRecorder.callStack.pop();
        return;
    }
    if (vec.length === 2) {
        if (!lessThanWithCount(vec[0], vec[1])) [vec[0], vec[1]] = [vec[1], vec[0]];
        if (stepRecorder) stepRecorder.record('base case (size=2, swap if needed)', frame, vec, null, null, depth);
        if (stepRecorder) stepRecorder.callStack.pop();
        return;
    }

    let pairs = createWinnerLoserPairs(vec);
    frame.locals.pairs = deepCopy(pairs);
    if (stepRecorder) stepRecorder.record('after createWinnerLoserPairs', frame, vec, pairs, null, depth);

    let straggler = extractStraggler(vec);
    frame.locals.straggler = straggler;
    if (stepRecorder) stepRecorder.record('after extractStraggler', frame, vec, pairs, straggler, depth);

    let winners = extractWinners(pairs);
    frame.locals.winners = deepCopy(winners);
    if (stepRecorder) stepRecorder.record('after extractWinners', frame, vec, winners, straggler, depth);

    if (stepRecorder) stepRecorder.record('before recursive fordJohnsonSort(winners)', frame, vec, winners, straggler, depth);
    fordJohnsonSort(winners, depth + 1, stepRecorder, frameIdCounter);
    frame.locals.winners = deepCopy(winners);
    if (stepRecorder) stepRecorder.record('after recursive fordJohnsonSort(winners)', frame, vec, winners, straggler, depth);

    let orderedPairs = orderPairsByWinners(pairs, winners);
    frame.locals.orderedPairs = deepCopy(orderedPairs);
    if (stepRecorder) stepRecorder.record('after orderPairsByWinners', frame, vec, orderedPairs, straggler, depth);

    let chain = buildInitialChain(orderedPairs, vec.length);
    frame.locals.chain = deepCopy(chain);
    if (stepRecorder) stepRecorder.record('after buildInitialChain', frame, vec, chain, straggler, depth);

    let insertionBounds = initializeInsertionBounds(orderedPairs.length);
    frame.locals.insertionBounds = deepCopy(insertionBounds);
    if (stepRecorder) stepRecorder.record('after initializeInsertionBounds', frame, vec, insertionBounds, straggler, depth);

    let pendingCount = (orderedPairs.length - 1) + (straggler === -1 ? 0 : 1);
    let insertionOrder = generateInsertionOrder(pendingCount);
    frame.locals.pendingCount = pendingCount;
    frame.locals.insertionOrder = deepCopy(insertionOrder);
    if (stepRecorder) stepRecorder.record('after generateInsertionOrder', frame, vec, insertionOrder, straggler, depth);

    insertPendingElements(insertionOrder, orderedPairs, chain, insertionBounds, straggler);
    frame.locals.chain = deepCopy(chain);
    frame.locals.insertionBounds = deepCopy(insertionBounds);
    if (stepRecorder) stepRecorder.record('after insertPendingElements', frame, vec, chain, straggler, depth);

    vec.length = 0;
    chain.forEach(x => vec.push(x));
    frame.locals.v = deepCopy(vec);
    if (stepRecorder) stepRecorder.record('exit (vec = chain)', frame, vec, chain, straggler, depth);

    if (stepRecorder) stepRecorder.callStack.pop();
}

// ------------------------------------------------------------
//  STEP RECORDER – updated comment for new Jacobsthal
// ------------------------------------------------------------
class StepRecorder {
    constructor() {
        this.steps = [];
        this.callStack = [];
    }

    record(phase, currentFrame, currentVec, extra, straggler, depth) {
        let comment = this.generateComment(phase, currentVec, extra, straggler, depth, comparisonCount);
        let snapshot = {
            step: this.steps.length,
            phase: phase,
            comment: comment,
            g_comp: comparisonCount,
            callStack: deepCopy(this.callStack.map(f => ({
                id: f.id,
                depth: f.depth,
                name: f.name,
                params: f.params,
                locals: f.locals
            }))),
            heapMap: this.generateHeapLayout()
        };
        if (this.callStack.length > 0) {
            let top = this.callStack[this.callStack.length - 1];
            snapshot.callStack[snapshot.callStack.length - 1].locals = deepCopy(top.locals);
        }
        this.steps.push(snapshot);
    }

    generateComment(phase, vec, extra, straggler, depth, cmpCount) {
        const prefix = `🔹 Depth ${depth} · Comparisons: ${cmpCount}\n`;
        let mainComment = '';
        
        if (phase.includes('enter')) mainComment = `🟢 Entered fordJohnsonSort() with vector [${vec.join(', ')}].`;
        else if (phase.includes('base case')) {
            if (vec.length === 1) mainComment = `⚪ Base case: vector size 1 → already sorted. Returning.`;
            else mainComment = `⚪ Base case: vector size 2 → swapped if needed. Now [${vec.join(', ')}].`;
        }
        else if (phase.includes('createWinnerLoserPairs')) mainComment = `➡️ Created winner/loser pairs: ${formatPairArray(extra)}.`;
        else if (phase.includes('extractStraggler')) mainComment = `➡️ Straggler (unpaired element): ${straggler === -1 ? 'none' : straggler}.`;
        else if (phase.includes('extractWinners')) mainComment = `➡️ Extracted winners: [${extra.join(', ')}]. These will be sorted recursively.`;
        else if (phase.includes('before recursive')) mainComment = `⬇️ Recursively sorting winners: [${extra.join(', ')}].`;
        else if (phase.includes('after recursive')) mainComment = `⬆️ Recursion finished. Winners are now sorted: [${extra.join(', ')}].`;
        else if (phase.includes('orderPairsByWinners')) mainComment = `➡️ Reordered pairs according to sorted winners: ${formatPairArray(extra)}.`;
        else if (phase.includes('buildInitialChain')) mainComment = `➡️ Built initial main chain: [${extra.join(', ')}] (first loser + all winners).`;
        else if (phase.includes('initializeInsertionBounds')) mainComment = `➡️ Insertion bounds initialized: [${extra.join(', ')}].`;
        else if (phase.includes('generateInsertionOrder')) {
            mainComment = `➡️ Generated Jacobsthal insertion order (new algorithm) for ${extra.length} pending elements: [${extra.join(', ')}].`;
            mainComment += `<div class="jacobsthal-detail">`;
            mainComment += `<span style="color:#ffb86b;">🔍 New Jacobsthal method (starts with 1,3):</span><br>`;
            mainComment += `• J(0)=1, J(1)=3, J(n)=J(n-1)+2·J(n-2)<br>`;
            mainComment += `• For each batch from J(k) down to J(k-1)+1, push index = i-2.<br>`;
            mainComment += `• This produces the optimal insertion order. Click "📘 Jacobsthal steps" for a full walkthrough with your current numbers.`;
            mainComment += `</div>`;
        }
        else if (phase.includes('insertPendingElements')) mainComment = `➡️ Inserted all pending elements. Main chain is now: [${extra.join(', ')}].`;
        else if (phase.includes('exit')) mainComment = `✅ Function finished. Vector replaced with sorted chain: [${extra.join(', ')}]. Returning.`;
        else mainComment = `📍 ${phase}.`;

        return prefix + mainComment;
    }

    generateHeapLayout() {
        let heap = {};
        let addr = 0x1000;
        this.callStack.forEach(frame => {
            Object.keys(frame.locals).forEach(key => {
                let val = frame.locals[key];
                if (Array.isArray(val) && key !== 'insertionBounds') {
                    let id = `frame_${frame.id}_${key}`;
                    heap[id] = { 
                        address: addr, 
                        content: deepCopy(val), 
                        size: val.length, 
                        capacity: val.length 
                    };
                    addr += 0x40;
                }
            });
            if (frame.params?.v) {
                let id = `frame_${frame.id}_param_v`;
                heap[id] = { 
                    address: addr, 
                    content: deepCopy(frame.params.v), 
                    size: frame.params.v.length, 
                    capacity: frame.params.v.length 
                };
                addr += 0x40;
            }
        });
        return heap;
    }
}

// ------------------------------------------------------------
//  UTILITIES
// ------------------------------------------------------------
function deepCopy(obj) { return JSON.parse(JSON.stringify(obj)); }

function formatPairArray(arr) {
    if (!Array.isArray(arr)) return JSON.stringify(arr);
    if (arr.length === 0) return '[]';
    if (typeof arr[0] === 'object' && arr[0] !== null && 'winner' in arr[0] && 'loser' in arr[0]) {
        return '[' + arr.map(p => `{W:${p.winner}, L:${p.loser}}`).join(', ') + ']';
    }
    return '[' + arr.join(', ') + ']';
}

function formatHeapContent(content) {
    if (!Array.isArray(content)) return JSON.stringify(content);
    if (content.length === 0) return '[]';
    if (typeof content[0] === 'object' && content[0] !== null) {
        return '[' + content.map(p => `{W:${p.winner}, L:${p.loser}}`).join(', ') + ']';
    }
    return '[' + content.join(', ') + ']';
}

function parseInput(str) {
    let normalized = str.replace(/,/g, ' ');
    let tokens = normalized.split(/\s+/).filter(s => s !== '');
    return tokens.map(Number).filter(n => !isNaN(n));
}

// ------------------------------------------------------------
//  UI RENDERING
// ------------------------------------------------------------
let steps = [];
let currentStep = 0;

function renderStep(index) {
    if (steps.length === 0) return;
    let step = steps[index];
    document.getElementById('cmpCount').innerText = step.g_comp;
    document.getElementById('stepLabel').innerText = `${index} / ${steps.length-1}`;
    document.getElementById('stepSlider').max = steps.length-1;
    document.getElementById('stepSlider').value = index;
    document.getElementById('stepComment').innerHTML = `<span class="comment-icon">💬</span> ${step.comment.replace(/\n/g, '<br>')}`;

    // Add pulsing effect to Jacobsthal button if current phase is Jacobsthal generation
    const jacobsthalBtn = document.getElementById('jacobsthalModalBtn');
    if (step.phase.includes('generateInsertionOrder')) {
        jacobsthalBtn.classList.add('btn-pulse');
    } else {
        jacobsthalBtn.classList.remove('btn-pulse');
    }

    renderCallStack(step.callStack);
    renderMemoryLayout(step.callStack, step.heapMap);
    if (step.callStack.length > 0) {
        renderLocalVars(step.callStack[step.callStack.length-1]);
        renderVectorVisual(step.callStack[step.callStack.length-1]);
    } else {
        document.getElementById('localVarsPanel').innerHTML = '<i>no active frame</i>';
        document.getElementById('vectorVisual').innerHTML = '<i>no vector</i>';
    }
}

function renderCallStack(stackFrames) {
    let container = document.getElementById('callStackContainer');
    container.innerHTML = '';
    stackFrames.forEach((frame, idx) => {
        let frameDiv = document.createElement('div');
        frameDiv.className = 'stack-frame';
        frameDiv.setAttribute('data-frame-id', frame.id);
        let header = `<div class="frame-header"><span>📌 fordJohnsonSort() [depth ${frame.depth}]</span><span style="color:#9cdcfe">frame #${frame.id}</span></div>`;
        let paramsHtml = `<div class="var-list"><span class="var-name">v (param):</span><span class="var-value">[${frame.params.v.join(', ')}]</span></div>`;
        let localsDiv = document.createElement('div');
        localsDiv.className = 'var-list';
        localsDiv.style.marginTop = '8px';
        let localsHtml = '';
        if (Object.keys(frame.locals).length > 0) {
            localsHtml += '<span style="color:#ffb86b; grid-column: span 2;">locals:</span>';
            for (let [k, val] of Object.entries(frame.locals)) {
                let display = formatPairArray(val);
                localsHtml += `<span class="var-name">${k}:</span><span class="var-value">${display}</span>`;
            }
        } else localsHtml = '<i style="grid-column: span 2;">no locals yet</i>';
        localsDiv.innerHTML = localsHtml;
        frameDiv.innerHTML = header + paramsHtml;
        frameDiv.appendChild(localsDiv);
        frameDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.stack-frame').forEach(f => f.classList.remove('selected'));
            frameDiv.classList.add('selected');
            renderLocalVars(frame);
            renderVectorVisual(frame);
        });
        container.appendChild(frameDiv);
    });
    if (stackFrames.length) {
        let topId = stackFrames[stackFrames.length-1].id;
        let topElem = container.querySelector(`[data-frame-id="${topId}"]`);
        if (topElem) topElem.classList.add('selected');
    }
}

function renderMemoryLayout(stackFrames, heapMap) {
    let memDiv = document.getElementById('memoryLayout');
    memDiv.innerHTML = '<h4 style="margin:0 0 10px 0; width:100%;">🧠 stack & heap simulation</h4>';
    let stackHtml = '<div class="stack-mem"><span style="color:#9cdcfe;">▼ STACK (grows down)</span><div class="mem-box">';
    stackFrames.forEach((frame, i) => {
        stackHtml += `<div style="border-left: 3px solid #5f9ea0; padding-left: 8px; margin-bottom: 10px;">`;
        stackHtml += `<span style="color:#ffb86b;">frame #${frame.id} (depth ${frame.depth})</span><br>`;
        stackHtml += `<span>EBP+0x${(i*0x80).toString(16)}: v → [${frame.params.v.join(', ')}] (heap@${heapMap[`frame_${frame.id}_param_v`]?.address.toString(16) || '??'})</span><br>`;
        if (frame.locals.pairs) stackHtml += `<span>EBP+0x${(i*0x80+0x20).toString(16)}: pairs (array)</span><br>`;
        if (frame.locals.winners) stackHtml += `<span>EBP+0x${(i*0x80+0x30).toString(16)}: winners → heap@${heapMap[`frame_${frame.id}_winners`]?.address.toString(16) || '??'}</span><br>`;
        if (frame.locals.chain) stackHtml += `<span>EBP+0x${(i*0x80+0x40).toString(16)}: chain → heap@${heapMap[`frame_${frame.id}_chain`]?.address.toString(16) || '??'}</span><br>`;
        stackHtml += `</div>`;
    });
    stackHtml += '</div></div>';
    
    let heapHtml = '<div class="heap-mem"><span style="color:#9cdcfe;">▲ HEAP (dynamic)</span><div class="mem-box">';
    Object.entries(heapMap).forEach(([id, block]) => {
        let contentDisplay = formatHeapContent(block.content);
        heapHtml += `<div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px;">`;
        heapHtml += `<span style="color:#c792ea;">0x${block.address.toString(16)}</span>  <span style="color:#7b9eb0;">${id}</span><br>`;
        heapHtml += `<span>content: ${contentDisplay}  (size=${block.size})</span>`;
        heapHtml += `</div>`;
    });
    heapHtml += '</div></div>';
    memDiv.innerHTML += stackHtml + heapHtml;
}

function renderLocalVars(frame) {
    let panel = document.getElementById('localVarsPanel');
    if (!frame) return;
    let html = `<div style="display: grid; grid-template-columns: auto 1fr; gap: 12px 20px;">`;
    html += `<span style="color:#ffb86b;">variable</span><span style="color:#ffb86b;">value</span>`;
    html += `<span class="var-name">v (param)</span><span class="var-value">[${frame.params.v.join(', ')}]</span>`;
    for (let [k, v] of Object.entries(frame.locals)) {
        let display = formatPairArray(v);
        html += `<span class="var-name">${k}</span><span class="var-value">${display}</span>`;
    }
    html += '</div>';
    panel.innerHTML = html;
}

function renderVectorVisual(frame) {
    let visDiv = document.getElementById('vectorVisual');
    if (!frame) return;
    let vec = frame.params.v || [];
    let html = '<div style="display:flex; flex-direction:column; gap:10px;">';
    html += '<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">';
    vec.forEach((val, idx) => {
        html += `<div style="display:flex; flex-direction:column; align-items:center;">
                    <div class="array-cell">${val}</div>
                    <span class="array-index">[${idx}]</span>
                  </div>`;
    });
    html += '</div>';
    if (frame.locals.winners) {
        html += `<div style="margin-top:12px;"><span style="color:#9cdcfe;">winners:</span> `;
        frame.locals.winners.forEach(v => html += `<span class="array-cell" style="background:#3e4a5a;">${v}</span> `);
        html += '</div>';
    }
    if (frame.locals.chain) {
        html += `<div style="margin-top:8px;"><span style="color:#9cdcfe;">chain:</span> `;
        frame.locals.chain.forEach(v => html += `<span class="array-cell" style="background:#4a5a6a;">${v}</span> `);
        html += '</div>';
    }
    visDiv.innerHTML = html;
}

// ------------------------------------------------------------
//  JACOBSTHAL MODAL – UPDATED for new algorithm
// ------------------------------------------------------------
function generateJacobsthalExplanation(pendingCount, insertionOrder) {
    if (pendingCount === undefined || pendingCount === null) {
        return "<p>No active frame with pendingCount. Please select a stack frame that has executed Jacobsthal generation.</p>";
    }
    // Recompute Jacobsthal numbers starting with [1,3]
    let jacobsthal = [1, 3];
    generateJacobsthalNumbersUpTo(jacobsthal, pendingCount);
    
    let html = `<div class="modal-step">`;
    html += `<span style="color:#ffb86b;">📌 Input:</span> pendingCount = <span class="modal-highlight">${pendingCount}</span><br><br>`;

    // Step 1: Jacobsthal generation
    html += `<span style="color:#ffb86b;">1. Generate Jacobsthal numbers (starting 1,3) until ≥ ${pendingCount}:</span><br>`;
    html += `Start: J0 = 1, J1 = 3<br>`;
    for (let i = 2; i < jacobsthal.length; i++) {
        html += `J${i} = J${i-1} + 2·J${i-2} = ${jacobsthal[i-1]} + 2·${jacobsthal[i-2]} = <span class="modal-highlight">${jacobsthal[i]}</span><br>`;
    }
    html += `→ Jacobsthal numbers up to limit: [${jacobsthal.join(', ')}]<br><br>`;

    // Step 2: Process each batch using new indexing
    html += `<span style="color:#ffb86b;">2. Generate insertion order using batches (k = 1..):</span><br>`;
    let used = new Array(pendingCount).fill(false);
    html += `<table style="border-collapse: collapse; width: 100%; margin-top: 8px;">`;
    html += `<tr><th style="text-align: left; color: #9cdcfe;">k</th><th style="text-align: left; color: #9cdcfe;">J[k]</th><th style="text-align: left; color: #9cdcfe;">J[k-1]</th><th style="text-align: left; color: #9cdcfe;">i range</th><th style="text-align: left; color: #9cdcfe;">idx = i-2</th><th style="text-align: left; color: #9cdcfe;">pushed?</th></tr>`;
    for (let k = 1; k < jacobsthal.length; k++) {
        let start = jacobsthal[k];
        let end = jacobsthal[k - 1];
        let indices = [];
        for (let i = start; i > end; i--) {
            let idx = i - 2;
            if (idx >= 0 && idx < pendingCount && !used[idx]) {
                indices.push(idx);
                used[idx] = true;
            }
        }
        if (indices.length > 0) {
            html += `<tr><td>${k}</td><td>${start}</td><td>${end}</td><td>${start} → ${end+1}</td><td>[${indices.map(x => x).join(', ')}]</td><td>✅</td></tr>`;
        } else {
            html += `<tr><td>${k}</td><td>${start}</td><td>${end}</td><td>${start} → ${end+1}</td><td>—</td><td>❌ (none or already used)</td></tr>`;
        }
    }
    html += `</table><br>`;

    // Remaining numbers (stragglers in insertion order)
    html += `<span style="color:#ffb86b;">3. Append unused indices in ascending order:</span><br>`;
    let remaining = [];
    for (let i = 0; i < pendingCount; i++) if (!used[i]) remaining.push(i);
    html += `Unused: [${remaining.join(', ')}] → appended.<br><br>`;

    // Step 3: Final insertion order
    html += `<span style="color:#ffb86b;">4. Final insertion order (0‑based indices):</span><br>`;
    html += `<span class="modal-highlight" style="font-size: 16px;">[${insertionOrder.join(', ')}]</span><br>`;
    html += `This means: insert pending elements in the order of these indices.<br>`;
    html += `The sequence is optimal because the batch sizes (differences of Jacobsthal numbers) minimise the upper bound for binary search.`;
    html += `</div>`;

    return html;
}

// ------------------------------------------------------------
//  FLOWCHART DEFINITIONS (stylish, with comments)
// ------------------------------------------------------------
const flowcharts = {
    overall: {
        title: "Overall Ford‑Johnson Algorithm",
        diagram: `flowchart TD
A["Start: fordJohnsonSort(vec)"] --> B{"vec.size() == 1?"}
B -->|Yes| C["Return"]
B -->|No| D{"vec.size() == 2?"}
D -->|Yes| E["Compare and swap if needed, return"]
D -->|No| F["createWinnerLoserPairs"]
F --> G["extractStraggler"]
G --> H["extractWinners"]
H --> I["Recursive fordJohnsonSort(winners)"]
I --> J["orderPairsByWinners"]
J --> K["buildInitialChain"]
K --> L["initializeInsertionBounds"]
L --> M["generateInsertionOrder (Jacobsthal)"]
M --> N["insertPendingElements"]
N --> O["vec = chain"]
O --> P["Return"]`,
        desc: "The complete recursive merge‑insertion sort. Divides into pairs, sorts winners recursively, then inserts pend elements in optimal Jacobsthal order."
    },
    pairs: {
        title: "Pair Creation (createWinnerLoserPairs)",
        diagram: `flowchart TD
A["Input: vector vec"] --> B["i = 0"]
B --> C{"i+1 < vec.size?"}
C -->|No| D["Return pairs"]
C -->|Yes| E["Compare vec[i] and vec[i+1] with cmp()"]
E --> F{"vec[i] < vec[i+1]?"}
F -->|Yes| G["winner = vec[i+1], loser = vec[i]"]
F -->|No| H["winner = vec[i], loser = vec[i+1]"]
G --> I["Push (winner, loser) to pairs"]
H --> I
I --> J["i += 2"]
J --> C`,
        desc: "Forms adjacent pairs, stores the larger as 'winner' and smaller as 'loser'. Each comparison increments the global counter."
    },
    winners: {
        title: "Winner Extraction & Reordering (extractWinners + orderPairsByWinners)",
        diagram: `flowchart TD
subgraph extractWinners
    A["From pairs, collect all winners"] --> B["Return winners array"]
end
subgraph orderPairsByWinners
    C["Input: pairs, sortedWinners"] --> D["For each winner in sortedWinners"]
    D --> E["Find pair with matching winner"]
    E --> F["Add pair to orderedPairs"]
    F --> G["Mark pair as used (winner = -1)"]
    G --> H["Next winner"]
    H --> D
    H --> I["Return orderedPairs"]
end
B -.-> C`,
        desc: "After recursive sort of winners, pairs are reordered so that their winners appear in the sorted order."
    },
    jacobsthal: {
        title: "Jacobsthal Insertion Order (generateInsertionOrder)",
        diagram: `flowchart TD
A["Input: pendingCount n"] --> B["If n==0, return []"]
B --> C["jacobsthal = [1, 3]"]
C --> D["Generate Jacobsthal numbers until ≥ n"]
D --> E["used = array false of size n"]
E --> F["for k = 1 to jacobsthal.length-1"]
F --> G["start = jacobsthal[k], end = jacobsthal[k-1]"]
G --> H["for i = start down to end+1"]
H --> I["idx = i - 2"]
I --> J{"idx valid and not used?"}
J -->|Yes| K["push idx, mark used"]
J -->|No| L["next i"]
K --> H
L --> H
H --> M["next k"]
M --> F
M --> N["Append all unused indices in ascending order"]
N --> O["Return insertionOrder"]`,
        desc: "Generates the optimal insertion order of pend elements using the Jacobsthal sequence (starting 1,3). Batch indices are i-2."
    },
    insert: {
        title: "Pending Insertion (insertPendingElements)",
        diagram: `flowchart TD
A["Input: insertionOrder, orderedPairs, chain, insertionBounds, straggler"] --> B["for each step in insertionOrder"]
B --> C{"Is this the last index and straggler exists?"}
C -->|Yes| D["value = straggler, searchLimit = chain.length"]
C -->|No| E["idx = step+1, value = orderedPairs[idx].loser"]
E --> F["searchLimit = insertionBounds[idx]"]
D --> G["pos = lower_bound(chain, value, 0, searchLimit)"]
F --> G
G --> H["Insert value at pos"]
H --> I["Update insertionBounds: all bounds ≥ pos incremented"]
I --> J["Next step"]
J --> B
J --> K["Done"]`,
        desc: "Inserts each pending element (losers and straggler) into the main chain using binary search. Insertion bounds are updated after each insert."
    }
};

// ------------------------------------------------------------
//  RANDOM GENERATOR (1-100, space separated)
// ------------------------------------------------------------
function generateRandomUniqueNumbers(count) {
    if (count > 1000) count = 1000;
    let numbers = new Set();
    while (numbers.size < count) {
        numbers.add(Math.floor(Math.random() * 100) + 1); // 1..100
    }
    return Array.from(numbers);
}

// ------------------------------------------------------------
//  RUN ENGINE
// ------------------------------------------------------------
function runWithCustomInput(inputString) {
    let numbers = parseInput(inputString);
    if (numbers.length === 0) {
        steps = [];
        renderStep(0);
        return;
    }
    comparisonCount = 0;
    steps = [];
    let recorder = new StepRecorder();
    let frameCounter = { id: 0 };
    fordJohnsonSort(numbers, 0, recorder, frameCounter);
    steps = recorder.steps;
    currentStep = 0;
    document.getElementById('stepSlider').max = steps.length - 1;
    document.getElementById('stepLabel').innerText = `0 / ${steps.length-1}`;
    renderStep(0);
}

// ------------------------------------------------------------
//  DEBOUNCE
// ------------------------------------------------------------
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// ------------------------------------------------------------
//  EVENT LISTENERS
// ------------------------------------------------------------
window.onload = function() {
    const inputField = document.getElementById('numberInput');
    const randomCountInput = document.getElementById('randomCount');
    const jacobsthalModal = document.getElementById('jacobsthalModal');
    const jacobsthalModalBody = document.getElementById('modalBody');
    const jacobsthalCloseBtn = document.getElementById('modalCloseBtn');
    const jacobsthalBtn = document.getElementById('jacobsthalModalBtn');
    
    const flowchartModal = document.getElementById('flowchartModal');
    const flowchartCloseBtn = document.getElementById('flowchartCloseBtn');
    const flowchartBtn = document.getElementById('flowchartBtn');
    const mermaidDiv = document.getElementById('mermaidDiagram');
    const flowchartDesc = document.getElementById('flowchartDesc');

    // Initial run
    runWithCustomInput(inputField.value);

    // Live input
    const debouncedRun = debounce(function(e) {
        runWithCustomInput(e.target.value);
    }, 400);
    inputField.addEventListener('input', debouncedRun);

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', function() {
        runWithCustomInput(inputField.value);
    });

    // Random generator – now space-separated
    document.getElementById('randomBtn').addEventListener('click', function() {
        let count = parseInt(randomCountInput.value, 10);
        if (isNaN(count) || count < 1) count = 8;
        let randoms = generateRandomUniqueNumbers(count);
        inputField.value = randoms.join(' '); // space-separated, no commas
        runWithCustomInput(inputField.value);
    });

    // Step slider & navigation
    document.getElementById('stepSlider').addEventListener('input', function(e) {
        currentStep = parseInt(e.target.value);
        renderStep(currentStep);
    });
    document.getElementById('prevBtn').addEventListener('click', function() {
        if (currentStep > 0) currentStep--;
        renderStep(currentStep);
        document.getElementById('stepSlider').value = currentStep;
    });
    document.getElementById('nextBtn').addEventListener('click', function() {
        if (currentStep < steps.length - 1) currentStep++;
        renderStep(currentStep);
        document.getElementById('stepSlider').value = currentStep;
    });
    // First and Last buttons
    document.getElementById('firstBtn').addEventListener('click', function() {
        currentStep = 0;
        renderStep(currentStep);
        document.getElementById('stepSlider').value = currentStep;
    });
    document.getElementById('lastBtn').addEventListener('click', function() {
        if (steps.length > 0) {
            currentStep = steps.length - 1;
            renderStep(currentStep);
            document.getElementById('stepSlider').value = currentStep;
        }
    });

    // Arrow keys (ignore inside inputs)
    window.addEventListener('keydown', function(e) {
        const active = document.activeElement.tagName.toLowerCase();
        if (active === 'input' || active === 'textarea') return;
        if (e.key === 'ArrowLeft') { e.preventDefault(); document.getElementById('prevBtn').click(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); document.getElementById('nextBtn').click(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); document.getElementById('lastBtn').click(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); document.getElementById('firstBtn').click(); }
    });

    // ---------- JACOBSTHAL MODAL ----------
    function openJacobsthalModal() {
        // Get currently selected frame or top frame
        let selectedFrame = null;
        const selectedElem = document.querySelector('.stack-frame.selected');
        if (selectedElem) {
            const frameId = selectedElem.getAttribute('data-frame-id');
            if (steps[currentStep]) {
                const frame = steps[currentStep].callStack.find(f => f.id == frameId);
                if (frame) selectedFrame = frame;
            }
        }
        // Fallback to top frame
        if (!selectedFrame && steps[currentStep] && steps[currentStep].callStack.length > 0) {
            selectedFrame = steps[currentStep].callStack[steps[currentStep].callStack.length - 1];
        }

        let pendingCount = selectedFrame?.locals?.pendingCount;
        let insertionOrder = selectedFrame?.locals?.insertionOrder;
        
        if (pendingCount === undefined) {
            jacobsthalModalBody.innerHTML = "<p>⚠️ No pendingCount found in current frame. Please step to a frame that has executed Jacobsthal generation.</p>";
        } else {
            let explanation = generateJacobsthalExplanation(pendingCount, insertionOrder || []);
            jacobsthalModalBody.innerHTML = explanation;
        }
        jacobsthalModal.style.display = 'flex';
    }

    jacobsthalBtn.addEventListener('click', openJacobsthalModal);
    jacobsthalCloseBtn.addEventListener('click', function() {
        jacobsthalModal.style.display = 'none';
    });

    // ---------- FLOWCHART MODAL ----------
    async function showFlowchart(key) {
        const fc = flowcharts[key];

        // inject diagram text
        mermaidDiv.textContent = fc.diagram;
        flowchartDesc.textContent = fc.desc;

        // clear previous rendering state
        mermaidDiv.removeAttribute("data-processed");

        // force Mermaid to render THIS node
        await mermaid.run({
            nodes: [mermaidDiv]
        });
    }

    flowchartBtn.addEventListener('click', function() {
        flowchartModal.style.display = 'flex';
        // Show overall by default
        showFlowchart('overall');
    });

    // Attach click handlers to option buttons
    document.querySelectorAll('[data-flowchart]').forEach(btn => {
        btn.addEventListener('click', function() {
            const key = this.getAttribute('data-flowchart');
            showFlowchart(key);
        });
    });

    flowchartCloseBtn.addEventListener('click', function() {
        flowchartModal.style.display = 'none';
    });

    // Close modals when clicking outside content
    window.addEventListener('click', function(e) {
        if (e.target === jacobsthalModal) {
            jacobsthalModal.style.display = 'none';
        }
        if (e.target === flowchartModal) {
            flowchartModal.style.display = 'none';
        }
    });
};
