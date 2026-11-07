let currentProblems = [];

function buildFactorTree(number) {
    // Any factor pair is valid. A divisor near the square root keeps trees compact.
    let divisor = Math.floor(Math.sqrt(number));
    while (divisor > 1 && number % divisor !== 0) divisor--;
    return {
        value: number,
        children: divisor === 1 ? [] : [buildFactorTree(divisor), buildFactorTree(number / divisor)]
    };
}

function primeFactors(tree) {
    if (tree.children.length === 0) return [tree.value];
    return tree.children.flatMap(primeFactors).sort((a, b) => a - b);
}

function selectFactors(leftFactors, rightFactors, type) {
    const primes = [...new Set([...leftFactors, ...rightFactors])].sort((a, b) => a - b);
    return primes.flatMap(prime => {
        const leftCount = leftFactors.filter(value => value === prime).length;
        const rightCount = rightFactors.filter(value => value === prime).length;
        // Repeated primes count separately: GCF uses the minimum, LCM the maximum.
        const count = type === 'gcf' ? Math.min(leftCount, rightCount) : Math.max(leftCount, rightCount);
        return Array(count).fill(prime);
    });
}

function factorProduct(factors) {
    return factors.reduce((product, prime) => product * prime, 1);
}

function renderFactorTree(tree, complete) {
    const nodes = [];
    const branches = [];
    let leafCount = 0;
    let maxDepth = 0;

    function position(node, depth) {
        const children = node.children.map(child => position(child, depth + 1));
        const x = children.length
            ? (children[0].x + children[1].x) / 2
            : 26 + leafCount++ * 48;
        const placed = { value: node.value, x, y: 26 + depth * 58, prime: children.length === 0 };
        maxDepth = Math.max(maxDepth, depth);
        nodes.push(placed);
        children.forEach(child => branches.push({ from: placed, to: child }));
        return placed;
    }

    const root = position(tree, 0);
    // Use the same coordinate scale for short and long trees so their values stay legible.
    const width = Math.max(196, (leafCount - 1) * 48 + 52);
    const height = maxDepth * 58 + 52;
    const offset = (width - ((leafCount - 1) * 48 + 52)) / 2;
    const lines = branches.map(({ from, to }) =>
        `<line class="tree-branch" x1="${from.x + offset}" y1="${from.y}" x2="${to.x + offset}" y2="${to.y}"/>`
    ).join('');
    const values = nodes.map(node => {
        const x = node.x + offset;
        const shape = node.prime
            ? `<circle class="tree-node prime-node" cx="${x}" cy="${node.y}" r="19"/>`
            : `<rect class="tree-node" x="${x - 22}" y="${node.y - 19}" width="44" height="38" rx="6"/>`;
        const visible = complete || node === root;
        return `${shape}${visible ? `<text class="tree-value" x="${x}" y="${node.y + 6}">${node.value}</text>` : ''}`;
    }).join('');
    const description = complete
        ? `Prime factorization tree for ${tree.value}. ${tree.value} = ${primeFactors(tree).join(' × ')}. Each pair of branches multiplies to its parent. Circled leaves are prime factors.`
        : `Blank factor tree for ${tree.value}. Fill in the factors on each branch. Circled leaves must be prime numbers.`;

    return `<svg class="factor-tree" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${description}">${lines}${values}</svg>`;
}

function renderTreePair(problem, complete, guides = true, showFactorization = true) {
    return `<div class="tree-pair">${problem.trees.map(tree => `
        <div class="tree-panel">
            ${guides ? renderFactorTree(tree, complete) : `<div class="tree-workspace">Factor tree for <strong>${tree.value}</strong></div>`}
            ${showFactorization ? `<p class="factorization">${tree.value} = ${complete ? primeFactors(tree).join(' × ') : '<span class="factor-blank"></span>'}</p>` : ''}
        </div>`).join('')}</div>`;
}

function renderSelectedFactorization(tree, includedFactors) {
    const remaining = includedFactors.slice();
    const values = primeFactors(tree).map(prime => {
        const index = remaining.indexOf(prime);
        if (index === -1) return `<span class="factor-value">${prime}</span>`;
        // Consume each occurrence so repeated primes are circled only as often as needed.
        remaining.splice(index, 1);
        return `<span class="factor-value selected-factor">${prime}</span>`;
    });
    return `<p class="factorization selected-factorization">${tree.value} = ${values.join(' × ')}</p>`;
}

function renderSolution(problem, type) {
    const factors = selectFactors(...problem.trees.map(primeFactors), type);
    const label = type.toUpperCase();
    const rule = type === 'gcf'
        ? 'Use only prime factors shared by both numbers, taking the smaller count of each.'
        : 'Find the <strong>highest power of each prime number</strong> that appears in either factorization. Multiply these powers to find the LCM.';
    const powers = type === 'lcm' ? `<span class="prime-powers">Highest powers: <strong>${[...new Set(factors)].map(prime => {
        const exponent = factors.filter(value => value === prime).length;
        return exponent === 1 ? String(prime) : `${prime}<sup>${exponent}</sup>`;
    }).join(' × ')}</strong>.</span>` : '';
    const calculation = factors.length > 1
        ? `${factors.join(' × ')} = ${factorProduct(factors)}`
        : String(factorProduct(factors));
    const noCommon = factors.length === 0 ? ' There are no shared prime factors, so the GCF is 1.' : '';
    return `<p class="solution-step">${rule}${noCommon}${powers}<strong class="solution-result">${label} = ${calculation}</strong></p>`;
}

function renderWorkedExample(problem, type) {
    const [left, right] = problem.trees.map(primeFactors);
    const factors = selectFactors(left, right, type);
    // For LCM, take all copies of a prime from the tree with the highest power.
    // For GCF, mark a matching set in each factorization and multiply just one set.
    const useLeft = prime => left.filter(value => value === prime).length >= right.filter(value => value === prime).length;
    const includedFactors = type === 'lcm'
        ? [factors.filter(useLeft), factors.filter(prime => !useLeft(prime))]
        : [factors, factors];
    const heading = type === 'lcm' ? 'LCM: choose the highest powers' : 'GCF: choose matching factors';
    const instruction = type === 'lcm'
        ? 'For each prime, use the factorization with the highest power. The circled factors from both rows make the final multiplication.'
        : 'Circle matching prime factors in both factorizations. Use the circled factors from one row in the final multiplication.';
    return `<section class="worked-operation" aria-label="${type.toUpperCase()} worked example">
        <h2>${heading}</h2><p>${instruction}</p>
        <div class="tree-pair factor-selection">${problem.trees.map((tree, index) => renderSelectedFactorization(tree, includedFactors[index])).join('')}</div>
        ${renderSolution(problem, type)}
    </section>`;
}

function problemTypes(type) {
    return type === 'both' ? ['lcm', 'gcf'] : [type];
}

function problemLabel(type) {
    return problemTypes(type).map(value => value.toUpperCase()).join(' and ');
}

function generateProblems() {
    const form = document.getElementById('practice-form');
    if (!form.reportValidity()) return;

    const maxNumber = Number(document.getElementById('max-number').value);
    const count = Number(document.getElementById('num-questions').value);
    const type = document.getElementById('question-type').value;
    const guides = document.getElementById('show-tree-guides').checked;
    const compositeTrees = [];
    for (let number = 4; number <= maxNumber; number++) {
        const tree = buildFactorTree(number);
        if (tree.children.length > 0) compositeTrees.push(tree);
    }

    currentProblems = Array.from({ length: count }, () => {
        const leftIndex = randInt(0, compositeTrees.length - 1);
        // Sample distinct composites without retries whenever two are available.
        let rightIndex = compositeTrees.length === 1 ? 0 : randInt(0, compositeTrees.length - 2);
        if (compositeTrees.length > 1 && rightIndex >= leftIndex) rightIndex++;
        const trees = [compositeTrees[leftIndex], compositeTrees[rightIndex]];
        const [left, right] = trees.map(tree => tree.value);
        const problem = { trees, type };
        problem.questionHtml = `<strong>Find the ${problemLabel(type)} of ${left} and ${right}.</strong>
            ${renderTreePair(problem, false, guides)}
            <div class="answer-lines">${problemTypes(type).map(value => `<span>${value.toUpperCase()} = ______________</span>`).join('')}</div>`;
        return problem;
    });

    renderProblemGrid(currentProblems);
    document.getElementById('worksheet-instructions').textContent = `${guides ? 'Complete each factor tree' : 'Draw a factor tree for each number'} and write the prime factorization. Then find the ${problemLabel(type)}.`;
    document.getElementById('worksheet-status').textContent = `Generated ${count} ${count === 1 ? 'question' : 'questions'}.`;
}

function openAnswerKey() {
    if (currentProblems.length === 0) return;
    const body = currentProblems.map((problem, index) => `
        <section class="answer-item">
            <h2>${index + 1}. ${problemLabel(problem.type)} of ${problem.trees.map(tree => tree.value).join(' and ')}</h2>
            ${renderTreePair(problem, true)}
            ${problemTypes(problem.type).map(type => renderSolution(problem, type)).join('')}
        </section>`).join('');
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.open();
    win.document.write(`<!DOCTYPE html>
        <html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LCM and GCF Answer Key</title></head>
        <body class="answer-key-page"><main class="container"><h1>LCM and GCF Answer Key</h1>
        <div class="button-row no-print"><button type="button" id="print-btn">Print Answer Key</button></div>
        ${body}</main></body></html>`);
    win.document.close();
    for (const file of ['practice_page_common.css', 'lcm_gcf.css']) {
        const link = win.document.createElement('link');
        link.rel = 'stylesheet';
        link.href = new URL(file, window.location.href).href;
        win.document.head.appendChild(link);
    }
    win.document.getElementById('print-btn').addEventListener('click', () => win.print());
}

document.addEventListener('DOMContentLoaded', () => {
    const example = { trees: [buildFactorTree(12), buildFactorTree(18)] };
    document.getElementById('worked-example').innerHTML = renderTreePair(example, true, true, false)
        + renderWorkedExample(example, 'lcm')
        + renderWorkedExample(example, 'gcf');
    document.getElementById('practice-form').addEventListener('submit', event => {
        event.preventDefault();
        generateProblems();
    });
    document.getElementById('answer-key-btn').addEventListener('click', openAnswerKey);
    document.getElementById('print-btn').addEventListener('click', () => window.print());
    generateProblems();
});
