function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y !== 0) {
        const temp = y;
        y = x % y;
        x = temp;
    }
    return x || 1;
}

function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
}

function simplifyFraction(numerator, denominator) {
    const factor = gcd(numerator, denominator);
    return {
        n: numerator / factor,
        d: denominator / factor
    };
}

function toMixedNumber(numerator, denominator) {
    const simplified = simplifyFraction(numerator, denominator);
    const whole = Math.floor(simplified.n / simplified.d);
    const remainder = simplified.n % simplified.d;
    return {
        whole,
        remainder,
        denominator: simplified.d
    };
}

function latexFraction(numerator, denominator) {
    return `\\frac{${numerator}}{${denominator}}`;
}

function latexMixed(whole, numerator, denominator) {
    if (numerator === 0) {
        return `${whole}`;
    }
    if (whole === 0) {
        return latexFraction(numerator, denominator);
    }
    return `${whole}\\,${latexFraction(numerator, denominator)}`;
}

function fractionValueLatex(value) {
    if (value.kind === 'mixed') {
        return latexMixed(value.whole, value.n, value.d);
    }
    return latexFraction(value.n, value.d);
}

function compareFractionValues(a, b) {
    const leftWhole = a.kind === 'mixed' ? a.whole : 0;
    const rightWhole = b.kind === 'mixed' ? b.whole : 0;
    const leftNumerator = leftWhole * a.d + a.n;
    const rightNumerator = rightWhole * b.d + b.n;
    return leftNumerator * b.d - rightNumerator * a.d;
}

function shuffle(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = randInt(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

function typesetCurrentPage() {
    if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise();
    }
}

function renderProblemGrid(problems) {
    const grid = document.getElementById('problem-grid');
    grid.innerHTML = '';

    problems.forEach((problem, index) => {
        const card = document.createElement('div');
        card.className = `problem-card ${problem.wide ? 'wide-card' : ''}`.trim();
        card.innerHTML = `<div class="problem-number">${index + 1}.</div><div class="problem-text">${problem.questionHtml}</div>`;
        grid.appendChild(card);
    });

    typesetCurrentPage();
}

function openAnswerKeyWindow(title, bodyHtml, extraStyle = '') {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
body{font-family:sans-serif;padding:24px;color:#1f2937}
h1{text-align:center;color:#1e40af}
.answer-item{margin-bottom:18px}
.answer-step{margin-left:12px;color:#334155}
${extraStyle}
</style>
</head>
<body>
<h1>${title}</h1>
${bodyHtml}
</body>
</html>`;

    const win = window.open('', '_blank');
    if (!win) {
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();

    const config = win.document.createElement('script');
    config.textContent = `window.MathJax = { tex: { inlineMath: [['$','$'], ['\\\\(','\\\\)']] }, svg: { fontCache: 'global' } };`;
    win.document.head.appendChild(config);

    const script = win.document.createElement('script');
    script.async = true;
    script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
    script.onload = () => {
        if (win.MathJax && win.MathJax.typesetPromise) {
            win.MathJax.typesetPromise();
        }
    };
    win.document.head.appendChild(script);
}
