let currentProblems = [];

function formatInteger(value) {
    return value < 0 ? `−${Math.abs(value)}` : String(value);
}

function formatEquation(left, right, operation) {
    const symbol = operation === 'addition' ? '+' : '−';
    const second = right < 0 ? `(${formatInteger(right)})` : formatInteger(right);
    return `${formatInteger(left)} ${symbol} ${second}`;
}

function renderExampleLine(start, end) {
    const x = value => 200 + value * 34;
    const startX = x(start);
    const endX = x(end);
    const direction = Math.sign(end - start);
    const arrowBase = endX - direction * 9;
    const ticks = Array.from({ length: 11 }, (_, index) => {
        const value = index - 5;
        return `<line x1="${x(value)}" y1="47" x2="${x(value)}" y2="59" stroke="currentColor"/>
            <text x="${x(value)}" y="77">${formatInteger(value)}</text>`;
    }).join('');
    const description = `Start at ${formatInteger(start)}. Move ${Math.abs(end - start)} units ${direction < 0 ? 'left' : 'right'} to ${formatInteger(end)}.`;

    return `<svg class="number-line-svg" viewBox="0 0 400 84" role="img" aria-label="${description}">
        <line x1="16" y1="53" x2="384" y2="53" stroke="currentColor" stroke-width="2"/>
        <g fill="currentColor" text-anchor="middle" font-size="16">${ticks}</g>
        <path d="M ${startX} 53 V 22 M ${endX} 53 V 22" stroke="var(--primary)" stroke-dasharray="3 3"/>
        <line x1="${startX}" y1="22" x2="${arrowBase}" y2="22" stroke="var(--primary)" stroke-width="3"/>
        <polygon points="${endX},22 ${arrowBase},16 ${arrowBase},28" fill="var(--primary)"/>
        <circle cx="${startX}" cy="53" r="4" fill="var(--primary)"/>
        <circle cx="${endX}" cy="53" r="4" fill="var(--primary)"/>
    </svg>`;
}

function makeIntegerProblem(left, right, operation, useContext) {
    const equation = formatEquation(left, right, operation);
    const result = operation === 'addition' ? left + right : left - right;
    let prompt = '';
    let unit = '';

    if (useContext && operation === 'addition') {
        const change = right > 0 ? `+${right}` : formatInteger(right);
        prompt = `A team's score is ${formatInteger(left)}. It changes by ${change}. What is its new score?`;
        unit = Math.abs(result) === 1 ? ' point' : ' points';
    } else if (useContext) {
        prompt = `The morning temperature was ${formatInteger(right)} °C. By afternoon it was ${formatInteger(left)} °C. What was the signed change in temperature?`;
        unit = ' °C';
    }

    const questionHtml = useContext
        ? `${prompt}<div class="problem-note">Write an equation and solve.</div><div class="answer-space"></div>`
        : `<span class="integer-expression">${equation} = _____</span><div class="answer-space"></div>`;

    return { left, right, operation, equation, result, prompt, unit, questionHtml, wide: useContext };
}

function generateProblems() {
    const form = document.getElementById('integer-practice-form');
    if (!form.reportValidity()) return;

    const operation = document.getElementById('operation').value;
    const format = document.getElementById('question-format').value;
    const maxMagnitude = Number(document.getElementById('max-magnitude').value);
    const count = Number(document.getElementById('num-questions').value);
    const operations = operation === 'mixed' ? ['addition', 'subtraction'] : [operation];
    // Cycle the signs for each operation so a short worksheet includes negative operands.
    const signPairs = [[1, -1], [-1, -1], [-1, 1], [1, 1], [0, -1], [-1, 0]];

    const problems = Array.from({ length: count }, (_, index) => {
        const type = operations[index % operations.length];
        const [leftSign, rightSign] = signPairs[Math.floor(index / operations.length) % signPairs.length];
        const left = leftSign * randInt(1, maxMagnitude);
        const right = rightSign * randInt(1, maxMagnitude);
        const useContext = format === 'context' || (format === 'mixed' && index % 3 === 1);
        return makeIntegerProblem(left, right, type, useContext);
    });

    currentProblems = shuffle(problems);
    renderProblemGrid(currentProblems);
    document.getElementById('worksheet-status').textContent = `Generated ${count} ${count === 1 ? 'question' : 'questions'}.`;
}

function openAnswerKey() {
    if (currentProblems.length === 0) return;

    const body = currentProblems.map((problem, index) => {
        const rewrite = problem.operation === 'subtraction'
            ? ` = ${formatEquation(problem.left, -problem.right, 'addition')}`
            : '';
        const calculation = `${problem.equation}${rewrite} = ${formatInteger(problem.result)}${problem.unit}`;
        return `<section class="answer-item">
            <strong>${index + 1}.</strong> ${problem.prompt}
            <div class="answer-step">${calculation}</div>
        </section>`;
    }).join('');

    openAnswerKeyWindow('Grade 7 Integer Practice Answer Key', body, '@media print { .answer-item { break-inside: avoid; } }', false);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('addition-example-line').innerHTML = renderExampleLine(2, -3);
    document.getElementById('subtraction-example-line').innerHTML = renderExampleLine(-3, 2);
    document.getElementById('integer-practice-form').addEventListener('submit', event => {
        event.preventDefault();
        generateProblems();
    });
    document.getElementById('answer-key-btn').addEventListener('click', openAnswerKey);
    document.getElementById('print-btn').addEventListener('click', () => window.print());
    generateProblems();
});
