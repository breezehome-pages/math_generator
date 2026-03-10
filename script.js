// --- Initialization ---
document.addEventListener("DOMContentLoaded", function() {
    toggleOperationOptions();
    setupDynamicExample();
});

// --- UI Logic ---

function toggleDecimalPlaces() {
    const isChecked = document.getElementById("include-decimal").checked;
    document.getElementById("decimal-places").disabled = !isChecked;
    updateExample();
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

function syncNumeralsWithCount() {
    const op = document.getElementById("operation")?.value;
    if (op === "division") return;
    const numValuesInput = document.getElementById("num-values");
    const numeralsInput = document.getElementById("num-numerals");
    if (!numValuesInput || !numeralsInput) return;

    const count = parseInt(numValuesInput.value, 10);
    if (!Number.isFinite(count) || count < 2) return;
    const parts = Array.from({ length: count }, (_, i) => String(i + 1));
    numeralsInput.value = parts.join("x");
    validateInputs();
    updateExample();
}

function toggleOperationOptions() {
    const op = document.getElementById("operation").value;
    const timesToggle = document.querySelectorAll(".times-table-only");
    const timesCheckbox = document.getElementById("enable-times-table");
    const timesContainer = document.getElementById("times-table-container");
    const numValuesInput = document.getElementById("num-values");
    const nonDivisionGroups = document.querySelectorAll(".non-division-only");
    const divisionGroups = document.querySelectorAll(".division-only");

    if (timesToggle.length) {
        if (op === "multiplication") {
            timesToggle.forEach(el => el.style.display = "flex");
        } else {
            timesToggle.forEach(el => el.style.display = "none");
            if (timesCheckbox) timesCheckbox.checked = false;
            if (timesContainer) timesContainer.style.display = "none";
        }
    }

    if (numValuesInput) {
        if (op === "division") {
            numValuesInput.value = 2;
            numValuesInput.disabled = true;
        } else {
            numValuesInput.disabled = false;
        }
    }

    if (nonDivisionGroups.length || divisionGroups.length) {
        if (op === "division") {
            nonDivisionGroups.forEach(el => el.style.display = "none");
            divisionGroups.forEach(el => el.style.display = "flex");
        } else {
            nonDivisionGroups.forEach(el => el.style.display = "flex");
            divisionGroups.forEach(el => el.style.display = "none");
        }
    }

    toggleLongDivisionOption();
    updateExample();
}

// Shows/hides generic Min-Max Limits
function toggleValueLimits() {
    const isChecked = document.getElementById("enable-value-limits").checked;
    const container = document.getElementById("value-limits-container");
    container.style.display = isChecked ? "flex" : "none";
    updateExample();
}

// Shows/hides Specific Times Table feature
function toggleTimesTable() {
    const isChecked = document.getElementById("enable-times-table").checked;
    const container = document.getElementById("times-table-container");
    container.style.display = isChecked ? "flex" : "none";
    updateExample();
}

function validateInputs() {
    const op = document.getElementById("operation")?.value;
    if (op === "division") {
        const errorSpan = document.getElementById("num-numerals-error");
        if (errorSpan) errorSpan.textContent = "";
        return true;
    }
    const numeralsInput = document.getElementById("num-numerals").value;
    const numValues = parseInt(document.getElementById("num-values").value);
    const errorSpan = document.getElementById("num-numerals-error");
    
    errorSpan.textContent = "";

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

function setupDynamicExample() {
    const form = document.getElementById("mathForm");
    if (!form) return;

    form.addEventListener("input", (e) => {
        if (e.target && e.target.id === "num-values") {
            syncNumeralsWithCount();
            return;
        }
        updateExample();
    });
    form.addEventListener("change", (e) => {
        if (e.target && e.target.id === "operation") {
            toggleOperationOptions();
            return;
        }
        if (e.target && e.target.id === "num-values") {
            syncNumeralsWithCount();
            return;
        }
        updateExample();
    });
    syncNumeralsWithCount();
    updateExample();
}

function generateExampleQuestion() {
    if (!validateInputs()) return null;

    const operation = document.getElementById("operation").value;
    let numValues = parseInt(document.getElementById("num-values").value);
    let numeralsInput = document.getElementById("num-numerals")?.value || "1x1";

    const timesTableEnabled = document.getElementById("enable-times-table")?.checked;
    const timesTableNum = parseInt(document.getElementById("times-table-number")?.value) || 6;
    const timesTableMaxMulti = parseInt(document.getElementById("times-table-max-multiplier")?.value) || 12;

    const limitsEnabled = document.getElementById("enable-value-limits")?.checked;
    const minLimitVal = parseInt(document.getElementById("min-value-limit")?.value);
    const maxLimitVal = parseInt(document.getElementById("max-value-limit")?.value);

    const includeDecimal = document.getElementById("include-decimal").checked;
    const decimalPlaces = parseInt(document.getElementById("decimal-places").value);
    const orientation = document.getElementById("orientation").value;
    const longDivision = document.getElementById("long-division-option")?.checked;

    if (operation === "division") {
        const dividendDigits = parseInt(document.getElementById("dividend-digits")?.value, 10) || 2;
        const divisorDigits = parseInt(document.getElementById("divisor-digits")?.value, 10) || 1;
        numValues = 2;
        numeralsInput = `${dividendDigits}x${divisorDigits}`;
    }

    let numNumerals = numeralsInput.toLowerCase().split("x").map(item => parseInt(item.trim(), 10));
    let numbers = [];

    if (operation === "multiplication" && timesTableEnabled) {
        numbers.push(timesTableNum);
        for (let j = 1; j < numValues; j++) {
            if (j === 1) {
                numbers.push(Math.floor(Math.random() * timesTableMaxMulti) + 1);
            } else {
                numbers.push(Math.floor(Math.random() * 9) + 1);
            }
        }
    } else {
        for (let j = 0; j < numValues; j++) {
            let digitIndex = (j < numNumerals.length) ? j : numNumerals.length - 1;
            let digitCount = numNumerals[digitIndex];
            let min = Math.pow(10, digitCount - 1);
            if (digitCount === 1) min = 1;
            let max = Math.pow(10, digitCount) - 1;

            if (limitsEnabled && j === 0) {
                if (!isNaN(minLimitVal)) min = minLimitVal;
                if (!isNaN(maxLimitVal)) max = maxLimitVal;
                if (max < min) max = min;
            }

            let number = Math.floor(Math.random() * (max - min + 1)) + min;
            if (includeDecimal) {
                let decString = (Math.random()).toFixed(decimalPlaces);
                number = parseFloat(number + parseFloat(decString));
            }
            numbers.push(number);
        }
    }

    if (operation === "division") {
        numbers.sort((a, b) => b - a);
        if (!includeDecimal) {
            if (numbers[1] === 0) numbers[1] = 1;
            let remainder = numbers[0] % numbers[1];
            numbers[0] = numbers[0] - remainder;
            if (numbers[0] === 0) numbers[0] = numbers[1] * 2;
        }
    } else if (operation === "subtraction") {
        numbers.sort((a, b) => b - a);
    }

    switch (operation) {
        case "addition":
            return orientation === "traditional"
                ? formatTraditional(numbers, "+")
                : `\\(${numbers.join(" + ")}\\)`;
        case "subtraction":
            return orientation === "traditional"
                ? formatTraditional(numbers, "-")
                : `\\(${numbers.join(" - ")}\\)`;
        case "multiplication":
            return orientation === "traditional"
                ? formatTraditional(numbers, "\\times")
                : `\\(${numbers.join(" \\times ")}\\)`;
        case "division":
            if (longDivision) {
                return `\\[ ${numbers[1]} \\enclose{longdiv}{${numbers[0]}} \\]`;
            }
            return `\\(${numbers[0]} \\div ${numbers[1]} = \\)`;
        default:
            return null;
    }
}

function updateExample() {
    const box = document.getElementById("live-example-math");
    if (!box) return;

    const example = generateExampleQuestion();
    if (!example) {
        box.textContent = "Fix the digits format to see an example.";
        return;
    }
    box.innerHTML = example;
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise();
    }
}

// --- Core Generation Logic ---

function generateArithmeticTable() {
    if(!validateInputs()) return;

    const table = document.getElementById("arithmetic-table");
    const operation = document.getElementById("operation").value;
    let numValues = parseInt(document.getElementById("num-values").value);
    let numeralsInput = document.getElementById("num-numerals")?.value || "1x1";
    
    // Grab Times Table limits
    const timesTableEnabled = document.getElementById("enable-times-table").checked;
    const timesTableNum = parseInt(document.getElementById("times-table-number").value) || 6;
    const timesTableMaxMulti = parseInt(document.getElementById("times-table-max-multiplier").value) || 12;

    // Grab Generic Min/Max limits
    const limitsEnabled = document.getElementById("enable-value-limits").checked;
    const minLimitVal = parseInt(document.getElementById("min-value-limit").value);
    const maxLimitVal = parseInt(document.getElementById("max-value-limit").value);
    
    const includeDecimal = document.getElementById("include-decimal").checked;
    const decimalPlaces = parseInt(document.getElementById("decimal-places").value);
    const orientation = document.getElementById("orientation").value;
    const longDivision = document.getElementById("long-division-option").checked;
    const numQuestions = parseInt(document.getElementById("num-questions").value);
    
    if (operation === "division") {
        const dividendDigits = parseInt(document.getElementById("dividend-digits")?.value, 10) || 2;
        const divisorDigits = parseInt(document.getElementById("divisor-digits")?.value, 10) || 1;
        numValues = 2;
        numeralsInput = `${dividendDigits}x${divisorDigits}`;
    }

    let numNumerals = numeralsInput.toLowerCase().split("x").map(item => parseInt(item.trim(), 10));
    
    table.innerHTML = "";
    let questions = [];

    for (let i = 0; i < numQuestions; i++) {
        let numbers = [];

        // --- SPECIFIC TIMES TABLE OVERRIDE ---
        if (operation === "multiplication" && timesTableEnabled) {
            numbers.push(timesTableNum); // Always locks the first number

            // Fills the remaining numbers (usually just 1 more for a standard times table)
            for (let j = 1; j < numValues; j++) {
                if (j === 1) {
                    // Generates random multiplier between 1 and the Max (e.g., 1-12)
                    numbers.push(Math.floor(Math.random() * timesTableMaxMulti) + 1);
                } else {
                    numbers.push(Math.floor(Math.random() * 9) + 1); 
                }
            }
        } 
        // --- STANDARD GENERATION (WITH MIN/MAX) ---
        else {
            for (let j = 0; j < numValues; j++) {
                let digitIndex = (j < numNumerals.length) ? j : numNumerals.length - 1;
                let digitCount = numNumerals[digitIndex];
                
                let min = Math.pow(10, digitCount - 1);
                if (digitCount === 1) min = 1; 
                let max = Math.pow(10, digitCount) - 1;
                
                if (limitsEnabled && j === 0) {
                    if (!isNaN(minLimitVal)) min = minLimitVal;
                    if (!isNaN(maxLimitVal)) max = maxLimitVal;
                    if (max < min) max = min;
                }

                let number = Math.floor(Math.random() * (max - min + 1)) + min;

                if (includeDecimal) {
                    let decString = (Math.random()).toFixed(decimalPlaces);
                    number = parseFloat(number + parseFloat(decString));
                }

                numbers.push(number);
            }
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

function formatTraditional(numbers, opSymbol) {
    let maxLength = Math.max(...numbers.map(n => n.toString().length));
    
    let padded = numbers.map(n => {
        let str = n.toString();
        let diff = maxLength - str.length;
        
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
