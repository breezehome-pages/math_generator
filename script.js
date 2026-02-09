// --- Initialization ---
document.addEventListener("DOMContentLoaded", function() {
    toggleLongDivisionOption();
    toggleMaxLimitInput();
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

function toggleMaxLimitInput() {
    const isChecked = document.getElementById("enable-max-limit").checked;
    const container = document.getElementById("max-limit-container");
    container.style.display = isChecked ? "flex" : "none";
    if (isChecked) {
        updateMaxLimitPlaceholder();
    }
}

function updateMaxLimitPlaceholder() {
    const numeralsInput = document.getElementById("num-numerals").value;
    const maxLimitInput = document.getElementById("max-value-limit");
    
    // Parse digits configuration
    const digitsArray = numeralsInput.toLowerCase().split('x').map(s => parseInt(s.trim()));
    
    // Calculate natural max for each term
    const maxArray = digitsArray.map(d => {
        if (isNaN(d)) return 9;
        return Math.pow(10, d) - 1;
    });

    if (maxArray.length > 0) {
        maxLimitInput.placeholder = maxArray.join('x');
    }
}

function validateInputs() {
    updateMaxLimitPlaceholder();

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
    const maxLimitEnabled = document.getElementById("enable-max-limit").checked;
    const maxLimitInputVal = document.getElementById("max-value-limit").value;
    
    const includeDecimal = document.getElementById("include-decimal").checked;
    const decimalPlaces = parseInt(document.getElementById("decimal-places").value);
    const orientation = document.getElementById("orientation").value;
    const longDivision = document.getElementById("long-division-option").checked;
    const numQuestions = parseInt(document.getElementById("num-questions").value);
    
    // 1. Parse Inputs into Arrays
    let numNumerals = numeralsInput.toLowerCase().split("x").map(item => parseInt(item.trim(), 10));
    
    // Handle Max Limits (Only if checkbox is enabled)
    let userLimits = [];
    if (maxLimitEnabled && maxLimitInputVal && maxLimitInputVal.trim() !== "") {
        userLimits = maxLimitInputVal.toLowerCase().split("x").map(item => parseInt(item.trim(), 10));
    }

    table.innerHTML = "";
    let questions = [];

    for (let i = 0; i < numQuestions; i++) {
        let numbers = [];

        for (let j = 0; j < numValues; j++) {
            // A. Determine Digit Count
            let digitIndex = (j < numNumerals.length) ? j : numNumerals.length - 1;
            let digitCount = numNumerals[digitIndex];
            
            // B. Determine Max Limit
            let currentLimit = null;
            if (userLimits.length > 0) {
                let limitIndex = (j < userLimits.length) ? j : userLimits.length - 1;
                currentLimit = userLimits[limitIndex];
                if (isNaN(currentLimit)) currentLimit = null;
            }

            // C. Calculate STANDARD Bounds
            let min = Math.pow(10, digitCount - 1);
            if (digitCount === 1) min = 1; 
            let max = Math.pow(10, digitCount) - 1;
            
            // D. Apply User Limit Override
            if (currentLimit !== null) {
                max = currentLimit;
                // Override min to 1 if a limit is set, allowing range 1-Limit
                min = 1; 
            }

            // E. Generate
            if (max < min) max = min;
            let number = Math.floor(Math.random() * (max - min + 1)) + min;

            // F. Safety Check
            if (currentLimit !== null && number > currentLimit) {
                number = currentLimit;
            }

            if (includeDecimal) {
                let decString = (Math.random()).toFixed(decimalPlaces);
                number = parseFloat(number + parseFloat(decString));
            }

            numbers.push(number);
        }

        // Operation Handling
        if (operation === "division") {
            numbers.sort((a, b) => b - a);
            if (!includeDecimal) {
                if (numbers[1] === 0) numbers[1] = 1; 
                let remainder = numbers[0] % numbers[1];
                numbers[0] = numbers[0] - remainder;
                if(numbers[0] === 0) numbers[0] = numbers[1] * 2;
            }
        } else if (operation === "subtraction") {
            numbers.sort((a, b) => b - a);
        }

        let answer;
        if (operation === "addition") answer = numbers.reduce((a, b) => a + b, 0);
        else if (operation === "subtraction") answer = numbers.reduce((a, b) => a - b);
        else if (operation === "multiplication") answer = numbers.reduce((a, b) => a * b, 1);
        else if (operation === "division") answer = numbers[0] / numbers[1];

        if(includeDecimal) answer = parseFloat(answer.toFixed(decimalPlaces));

        // Latex Formatting
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

    sessionStorage.setItem("math_answers", JSON.stringify(questions));

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

    MathJax.typesetPromise();
    
    if (!document.getElementById('print-style-block')) {
        const style = document.createElement('style');
        style.id = 'print-style-block';
        style.innerHTML = '@media print { #print-header { display: block !important; margin-bottom: 20px; } }';
        document.head.appendChild(style);
    }
}

// FIX: Manually build the padding string instead of using padStart with LaTeX
function formatTraditional(numbers, opSymbol) {
    // 1. Find the length of the longest number
    let maxLength = Math.max(...numbers.map(n => n.toString().length));
    
    // 2. Map numbers to padded LaTeX strings
    let padded = numbers.map(n => {
        let str = n.toString();
        let diff = maxLength - str.length;
        
        // Manual loop to add \phantom{0} for every missing digit
        let padding = "";
        for (let k = 0; k < diff; k++) {
            padding += "\\phantom{0}";
        }
        
        return padding + str;
    });

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

function generateAnswerKey() {
    const data = sessionStorage.getItem("math_answers");
    if (!data) {
        alert("Please generate questions first.");
        return;
    }
    const questions = JSON.parse(data);
    let html = `<html><head><title>Answer Key</title><style>body{font-family:sans-serif;padding:30px}.key-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}.key-item{border:1px solid #ddd;padding:15px;border-radius:5px;page-break-inside:avoid}h1{text-align:center;color:#1e40af}</style><script src="https://polyfill.io/v3/polyfill.min.js?features=es6"><\/script><script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"><\/script></head><body><h1>Answer Key</h1><div class="key-grid">`;
    function getSymbol(op) {
        if(op === 'addition') return ' + ';
        if(op === 'subtraction') return ' - ';
        if(op === 'multiplication') return ' × ';
        if(op === 'division') return ' ÷ ';
        return ' ';
    }
    questions.forEach((q, i) => {
        let prob = q.numbers.join(getSymbol(q.operation));
        html += `<div class="key-item"><strong>${i+1}.</strong> Answer: <b>${q.answer}</b><br><small style="color:#666">Problem: ${prob}</small></div>`;
    });
    html += `</div></body></html>`;
    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
}
