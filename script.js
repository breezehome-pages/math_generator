// --- Initialization ---
document.addEventListener("DOMContentLoaded", function() {
    toggleLongDivisionOption();
    updateMaxLimitPlaceholder();
});

// --- UI Logic ---

function toggleDecimalPlaces() {
    const isChecked = document.getElementById("include-decimal").checked;
    document.getElementById("decimal-places").disabled = !isChecked;
}

function toggleLongDivisionOption() {
    const op = document.getElementById("operation").value;
    const container = document.getElementById("long-division-container");
    const checkbox = document.getElementById("long-division-option");
    
    if (op === "division") {
        container.style.display = "flex";
        checkbox.checked = true;
    } else {
        container.style.display = "none";
        checkbox.checked = false;
    }
}

function updateMaxLimitPlaceholder() {
    const numeralsInput = document.getElementById("num-numerals").value;
    const maxLimitInput = document.getElementById("max-value-limit");
    
    // Extract numbers from "3x2" etc.
    const digits = numeralsInput.toLowerCase().split('x').map(s => parseInt(s.trim()));
    // Find max digit count
    const maxDigits = Math.max(...digits.filter(n => !isNaN(n)));
    
    if (maxDigits > 0) {
        const naturalMax = Math.pow(10, maxDigits) - 1;
        maxLimitInput.placeholder = naturalMax;
    }
}

function validateInputs() {
    const numeralsInput = document.getElementById("num-numerals").value;
    const numValues = parseInt(document.getElementById("num-values").value);
    const errorSpan = document.getElementById("num-numerals-error");
    
    errorSpan.textContent = "";

    // Basic regex validation
    if (!/^[\dx]+$/i.test(numeralsInput)) {
        errorSpan.textContent = "Only digits and 'x' allowed";
        return false;
    }

    const parts = numeralsInput.toLowerCase().split('x').filter(p => p !== "");
    if (parts.length !== numValues && parts.length !== 1) {
        // We allow length 1 (e.g. "2" becomes "2x2" logic automatically)
        if(parts.length > 1 && parts.length !== numValues) {
                errorSpan.textContent = `Expected ${numValues} terms (e.g. 3x2x1)`;
                return false;
        }
    }
    return true;
}

// --- Core Generation Logic ---

function generateArithmeticTable() {
    if(!validateInputs()) return;

    const table = document.getElementById("arithmetic-table");
    const operation = document.getElementById("operation").value;
    const numValues = parseInt(document.getElementById("num-values").value);
    const numeralsInput = document.getElementById("num-numerals").value;
    const includeDecimal = document.getElementById("include-decimal").checked;
    const decimalPlaces = parseInt(document.getElementById("decimal-places").value);
    const orientation = document.getElementById("orientation").value;
    const longDivision = document.getElementById("long-division-option").checked;
    const numQuestions = parseInt(document.getElementById("num-questions").value);
    
    // Max Limit Logic
    let userMaxLimit = parseInt(document.getElementById("max-value-limit").value);
    if (isNaN(userMaxLimit)) userMaxLimit = null;

    // Parse numerals config (e.g., "3x2")
    let numNumerals = numeralsInput.toLowerCase().split("x").map(item => parseInt(item.trim(), 10));

    table.innerHTML = "";
    let questions = [];

    for (let i = 0; i < numQuestions; i++) {
        let numbers = [];

        for (let j = 0; j < numValues; j++) {
            // Logic: recycle the last defined digit count if we run out
            let digitIndex = (j < numNumerals.length) ? j : numNumerals.length - 1;
            let digitCount = numNumerals[digitIndex];
            
            let min = Math.pow(10, digitCount - 1);
            if (digitCount === 1) min = 1; // Start at 1 for single digits
            
            let naturalMax = Math.pow(10, digitCount) - 1;
            
            // Apply the User defined Max Limit
            let effectiveMax = naturalMax;
            if (userMaxLimit && userMaxLimit < naturalMax) {
                effectiveMax = userMaxLimit;
            }

            // Safety check
            if (effectiveMax < min) {
                alert(`Error: Max limit (${effectiveMax}) is smaller than minimum possible value (${min}) for a ${digitCount}-digit number.`);
                return;
            }

            let number = Math.floor(Math.random() * (effectiveMax - min + 1)) + min;

            if (includeDecimal) {
                let decString = (Math.random()).toFixed(decimalPlaces);
                number = parseFloat(number + parseFloat(decString));
            }

            numbers.push(number);
        }

        // Handle Operation Specifics
        if (operation === "division") {
            numbers.sort((a, b) => b - a); // Ensure dividend is larger
            if (!includeDecimal) {
                // Ensure no remainders for integer division
                let remainder = numbers[0] % numbers[1];
                numbers[0] = numbers[0] - remainder;
                if(numbers[0] === 0) numbers[0] = numbers[1] * 2;
            }
        } else if (operation === "subtraction") {
            numbers.sort((a, b) => b - a); // Ensure positive result
        }

        // Calculate Answer
        let answer;
        if (operation === "addition") answer = numbers.reduce((a, b) => a + b, 0);
        else if (operation === "subtraction") answer = numbers.reduce((a, b) => a - b);
        else if (operation === "multiplication") answer = numbers.reduce((a, b) => a * b, 1);
        else if (operation === "division") answer = numbers[0] / numbers[1];

        if(includeDecimal) answer = parseFloat(answer.toFixed(decimalPlaces));

        // Generate LaTeX and Spacing
        let questionLatex, solutionSpace;

        switch (operation) {
            case "addition":
                if (orientation === "traditional") {
                    questionLatex = formatTraditional(numbers, "+");
                } else {
                    questionLatex = `\\(${numbers.join(" + ")}\\)`;
                }
                solutionSpace = `<div style="height: 100px;"></div>`;
                break;
            case "subtraction":
                if (orientation === "traditional") {
                    questionLatex = formatTraditional(numbers, "-");
                } else {
                    questionLatex = `\\(${numbers.join(" - ")}\\)`;
                }
                solutionSpace = `<div style="height: 100px;"></div>`;
                break;
            case "multiplication":
                if (orientation === "traditional") {
                    questionLatex = formatTraditional(numbers, "\\times");
                } else {
                    questionLatex = `\\(${numbers.join(" \\times ")}\\)`;
                }
                solutionSpace = `<div style="height: 120px;"></div>`;
                break;
            case "division":
                if (longDivision) {
                    questionLatex = `\\[ ${numbers[1]} \\enclose{longdiv}{${numbers[0]}} \\]`;
                    solutionSpace = `<div style="height: 150px;"></div>`;
                } else {
                    questionLatex = `\\(${numbers[0]} \\div ${numbers[1]} = \\)`;
                    solutionSpace = `<div style="height: 80px;"></div>`;
                }
                break;
        }

        questions.push({ numbers, questionLatex, answer, operation, longDivision });
    }

    // Save for answer key
    sessionStorage.setItem("math_answers", JSON.stringify(questions));

    // Render Table (3 columns)
    let row;
    questions.forEach((q, index) => {
        if (index % 3 === 0) row = table.insertRow();
        let cell = row.insertCell();
        cell.innerHTML = `
            <div class="question-box">
                <strong>${index + 1}.</strong> 
                ${q.questionLatex}
            </div>
            ${q.solutionSpace || ''}
        `;
    });

    // Trigger MathJax
    MathJax.typesetPromise();
    
    // Show print header in print mode
    if (!document.getElementById('print-style-block')) {
        const style = document.createElement('style');
        style.id = 'print-style-block';
        style.innerHTML = '@media print { #print-header { display: block !important; margin-bottom: 20px; } }';
        document.head.appendChild(style);
    }
}

// --- Helper Formatting ---

function formatTraditional(numbers, opSymbol) {
    let maxLength = Math.max(...numbers.map(n => n.toString().length));
    let padded = numbers.map(n => n.toString().padStart(maxLength, '\\phantom{0}'));
    
    let content = "";
    for(let i=0; i<padded.length; i++) {
        if(i === padded.length - 1) {
            content += `\\underline{${opSymbol} \\quad ${padded[i]}}`;
        } else {
            content += `${padded[i]} \\\\ `;
        }
    }

    return `\\[ \\begin{array}{r} ${content} \\end{array} \\]`;
}

// --- Answer Key Logic ---

function generateAnswerKey() {
    const data = sessionStorage.getItem("math_answers");
    if (!data) {
        alert("Please generate questions first.");
        return;
    }
    const questions = JSON.parse(data);
    
    let html = `
        <html>
        <head>
            <title>Answer Key</title>
            <style>
                body { font-family: sans-serif; padding: 30px; }
                .key-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
                .key-item { border: 1px solid #ddd; padding: 15px; border-radius: 5px; page-break-inside: avoid; }
                h1 { text-align: center; color: #1e40af; }
            </style>
            <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"><\/script>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script>
        </head>
        <body>
            <h1>Answer Key</h1>
            <div class="key-grid">
    `;

    function getSymbol(op) {
        if(op === 'addition') return ' + ';
        if(op === 'subtraction') return ' - ';
        if(op === 'multiplication') return ' × ';
        if(op === 'division') return ' ÷ ';
        return ' ';
    }

    questions.forEach((q, i) => {
        let prob = q.numbers.join(getSymbol(q.operation));
        // Simple text representation for the key logic
        
        html += `
            <div class="key-item">
                <strong>${i+1}.</strong> Answer: <b>${q.answer}</b><br>
                <small style="color:#666">Problem: ${prob}</small>
            </div>
        `;
    });

    html += `</div></body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}
