function toggleDecimalPlaces() {
    document.getElementById("decimal-places").disabled = !document.getElementById("include-decimal").checked;
}

function validateNumeralFormat() {
    let numValues = parseInt(document.getElementById("num-values").value);
    let numNumerals = document.getElementById("num-numerals").value.split("x").map(Number);
    let errorMessage = document.getElementById("num-numerals-error");

    if (numNumerals.length !== numValues) {
        errorMessage.textContent = `Must specify ${numValues} terms (e.g., ${"3x".repeat(numValues - 1)}2)`;
    } else {
        errorMessage.textContent = ""; // Clear error if valid
    }
}


function toggleLongDivisionOption() {
    let operation = document.getElementById("operation").value;
    let longDivisionCheckbox = document.getElementById("long-division-option");

    if (operation === "division") {
        longDivisionCheckbox.disabled = false;
    } else {
        longDivisionCheckbox.disabled = true;
        longDivisionCheckbox.checked = false; // Uncheck if switching away from division
    }
}

document.getElementById("operation").addEventListener("change", toggleLongDivisionOption);


function generateArithmeticTable() {
    var table = document.getElementById("arithmetic-table");
    var operation = document.getElementById("operation").value;
    var numValues = parseInt(document.getElementById("num-values").value);
    var numNumerals = document.getElementById("num-numerals").value.split("x").map(Number);
    var includeDecimal = document.getElementById("include-decimal").checked;
    var decimalPlaces = parseInt(document.getElementById("decimal-places").value);
    var orientation = document.getElementById("orientation").value;
    var longDivision = document.getElementById("long-division-option").checked;
    var numQuestions = parseInt(document.getElementById("num-questions").value);

    let errorMessage = document.getElementById("num-numerals-error");
    if (numNumerals.length !== numValues) {
        errorMessage.textContent = `Error: Must specify ${numValues} terms (e.g., ${"3x".repeat(numValues - 1)}2)`;
        return;
    } else {
        errorMessage.textContent = "";
    }

    table.innerHTML = "";
    let questions = [];

    for (let i = 0; i < numQuestions; i++) {
        let numbers = [];

        for (let j = 0; j < numValues; j++) {
            let min = Math.pow(10, numNumerals[j] - 1);
            let max = Math.pow(10, numNumerals[j]) - 1;
            let number = Math.floor(Math.random() * (max - min + 1)) + min;

            if (includeDecimal) {
                number = parseFloat((number + Math.random()).toFixed(decimalPlaces));
            }

            numbers.push(number);
        }

        let questionLatex, answer;
        switch (operation) {
            case "addition":
                questionLatex = `\\(${numbers.join(" + ")}\\)`;
                answer = numbers.reduce((a, b) => a + b, 0);
                break;
            case "subtraction":
                questionLatex = `\\(${numbers.join(" - ")}\\)`;
                answer = numbers.reduce((a, b) => a - b);
                break;
            case "multiplication":
                if (orientation === "inline") {
                    questionLatex = `\\(${numbers.join(" \\times ")}\\)`;
                } else {
                    questionLatex = `\\[
                        \\begin{array}{r}
                        ${numbers.slice(0, -1).join(" \\\\ ")} \\\\
                        \\times \\ ${numbers[numbers.length - 1]} \\\\
                        \\hline
                        \\end{array}
                    \\]`;
                }
                answer = numbers.reduce((a, b) => a * b, 1);
                break;
            case "division":
                numbers.sort((a, b) => b - a);
                let dividend = numbers[0];
                let divisor = numbers[1];

                if (longDivision) {
                    questionLatex = `\\(\\require{enclose}\\enclose{longdiv}{${dividend}\\div${divisor}}\\)`;
                } else {
                    questionLatex = `\\(${dividend} \\div ${divisor} = \\underline{\\quad\\quad}\\)`;
                }

                answer = dividend / divisor;
                break;
        }

        answer = parseFloat(answer.toFixed(decimalPlaces));
        questions.push({ numbers, questionLatex, answer, longDivision });
    }

    sessionStorage.setItem("answers", JSON.stringify(questions));

    let k = 0;
    for (let i = 0; i < Math.ceil(numQuestions / 3); i++) {
        let row = table.insertRow();
        for (let j = 0; j < 3; j++) {
            if (k >= questions.length) break;
            let cell = row.insertCell();
            let questionDisplay = questions[k].questionLatex;

            if (questions[k].longDivision) {
                // Add 20 blank lines below for long division
                questionDisplay += `<br>` + "&nbsp;".repeat(20).replace(/ /g, "<br>");
            }

            cell.innerHTML = `<b>${k + 1}.</b> <span class="math">${questionDisplay}</span>`;
            k++;
        }
    }

    // ✅ Ensure MathJax processes LaTeX correctly
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}





function generateAnswerKey() {
    let answers = JSON.parse(sessionStorage.getItem("answers"));
    let includeDecimal = document.getElementById("include-decimal").checked;
    let decimalPlaces = includeDecimal ? parseInt(document.getElementById("decimal-places").value) : 0;

    if (!answers || answers.length === 0) {
        alert("No questions generated yet. Please click 'Generate' first.");
        return;
    }

    let answerPage = `<!DOCTYPE html>
    <html>
    <head>
        <title>Answer Key</title>
        <script>
            window.MathJax = {
                loader: {load: ['[tex]/enclose']}, 
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['\\[', '\\]']],
                    packages: {'[+]': ['enclose']}
                },
                svg: { fontCache: 'global' }
            };
        </script>
        <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    </head>
    <body>
        <h1>Answer Key</h1>
        <ol style="font-size: 18px;">`;

    answers.forEach((q, i) => {
        let formattedAnswer = includeDecimal 
            ? q.answer.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces })
            : Math.round(q.answer).toLocaleString();

        answerPage += `<li style="margin-bottom: 40px;">`;

        if (q.longDivision) {
            // ✅ Properly format long division in a LaTeX block
            answerPage += `<br>
                \\[
                \\require{enclose}
                \\enclose{longdiv}{${q.numbers[0]}\\div${q.numbers[1]}}
                \\]
                ${generateLongDivisionSteps(q.numbers[0], q.numbers[1])}`;
        } else {
            answerPage += `\\(${q.questionLatex} = ${formattedAnswer}\\)`;
        }

        answerPage += `</li>`;
    });

    answerPage += `</ol>
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                if (window.MathJax) {
                    MathJax.typesetPromise();
                }
            });
        </script>
    </body>
    </html>`;

    let win = window.open("", "_blank");
    win.document.write(answerPage);
    win.document.close();
}

/**
 * Generates a step-by-step long division solution using LaTeX.
 */
function generateLongDivisionSteps(dividend, divisor) {
    let quotient = Math.floor(dividend / divisor);
    let remainder = dividend % divisor;
    let steps = [];
    let digits = String(dividend).split("").map(Number);

    let tempDividend = 0;
    let resultDigits = [];
    let stepResults = [];

    digits.forEach((digit) => {
        tempDividend = tempDividend * 10 + digit;
        if (tempDividend >= divisor) {
            let tempQuotient = Math.floor(tempDividend / divisor);
            let tempRemainder = tempDividend % divisor;
            stepResults.push({ partial: tempDividend, subtracted: tempQuotient * divisor, remainder: tempRemainder });

            tempDividend = tempRemainder;
            resultDigits.push(tempQuotient);
        } else {
            resultDigits.push(0);
        }
    });

    let longDivisionLatex = `
        \\[
        \\text{Solution:} \\\\
        \\begin{array}{r}
    `;

    stepResults.forEach((step) => {
        longDivisionLatex += `
            ${step.partial} \\div ${divisor} = ${Math.floor(step.partial / divisor)}, \\\\
            ${step.partial} - ${step.subtracted} = ${step.remainder} \\\\
        `;
    });

    longDivisionLatex += `
        \\text{Final Quotient: } ${quotient}, \\text{ Remainder: } ${remainder}
        \\end{array}
        \\]
    `;

    return longDivisionLatex;
}






const date = new Date();
document.getElementById("date").innerHTML = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
