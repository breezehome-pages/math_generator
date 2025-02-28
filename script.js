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

// Addition steps with carrying
function generateAdditionSteps(numbers) {
    // Convert all numbers to strings and determine max length
    let strNumbers = numbers.map(num => num.toString());
    let maxLength = Math.max(...strNumbers.map(str => str.length));
    
    // Pad numbers with spaces to align them
    let paddedNumbers = strNumbers.map(str => str.padStart(maxLength, ' '));
    
    // Track carries
    let carries = Array(maxLength + 1).fill(0);
    let carryLine = ' '.repeat(maxLength);
    
    // Calculate column by column
    for (let i = maxLength - 1; i >= 0; i--) {
        let columnSum = 0;
        for (let j = 0; j < paddedNumbers.length; j++) {
            let digit = parseInt(paddedNumbers[j][i]) || 0;
            columnSum += digit;
        }
        columnSum += carries[i + 1];  // Add carry from previous column
        
        if (columnSum >= 10) {
            carries[i] = Math.floor(columnSum / 10);
            carryLine = carryLine.substring(0, i) + carries[i] + carryLine.substring(i + 1);
        }
    }
    
    // Format for LaTeX
    let hasCarries = carryLine.trim().length > 0;
    let latexOutput = `\\begin{array}{r}\n`;
    
    if (hasCarries) {
        latexOutput += `\\text{Carries: } ${carryLine.replace(/ /g, '\\phantom{0}')} \\\\\n`;
    }
    
    for (let i = 0; i < paddedNumbers.length; i++) {
        let displayNum = paddedNumbers[i].replace(/ /g, '\\phantom{0}');
        if (i === paddedNumbers.length - 1) {
            latexOutput += `\\underline{${displayNum}} \\\\\n`;
        } else {
            latexOutput += `${displayNum} \\\\\n`;
        }
    }
    
    // Calculate and add result
    let result = numbers.reduce((sum, num) => sum + num, 0);
    latexOutput += `${result}\n\\end{array}`;
    
    return latexOutput;
}

// Subtraction steps with borrowing
function generateSubtractionSteps(numbers) {
    if (numbers.length !== 2) {
        // For more than 2 numbers, show simple equation
        return `\\(${numbers.join(" - ")} = ${numbers.reduce((a, b) => a - b)}\\)`;
    }
    
    let minuend = numbers[0].toString();
    let subtrahend = numbers[1].toString();
    let maxLength = Math.max(minuend.length, subtrahend.length);
    
    // Pad with spaces for alignment
    let paddedMinuend = minuend.padStart(maxLength, ' ');
    let paddedSubtrahend = subtrahend.padStart(maxLength, ' ');
    
    // Track borrows
    let borrowLine = ' '.repeat(maxLength);
    let borrowNeeded = false;
    
    let minuendDigits = paddedMinuend.split('').map(c => c === ' ' ? 0 : parseInt(c));
    
    // Check for borrowing
    for (let i = maxLength - 1; i >= 0; i--) {
        let topDigit = parseInt(paddedMinuend[i]) || 0;
        let bottomDigit = parseInt(paddedSubtrahend[i]) || 0;
        
        if (topDigit < bottomDigit) {
            borrowNeeded = true;
            // Find the nearest non-zero digit to borrow from
            let j = i - 1;
            while (j >= 0 && minuendDigits[j] === 0) {
                minuendDigits[j] = 9;
                j--;
            }
            
            if (j >= 0) {
                minuendDigits[j]--;
                borrowLine = borrowLine.substring(0, i) + '1' + borrowLine.substring(i + 1);
            }
        }
    }
    
    // Format for LaTeX
    let latexOutput = `\\begin{array}{r}\n`;
    
    if (borrowNeeded) {
        latexOutput += `\\text{Borrows: } ${borrowLine.replace(/ /g, '\\phantom{0}')} \\\\\n`;
    }
    
    latexOutput += `${paddedMinuend.replace(/ /g, '\\phantom{0}')} \\\\\n`;
    latexOutput += `\\underline{-${paddedSubtrahend.replace(/ /g, '\\phantom{0}')}} \\\\\n`;
    
    // Calculate and add result
    let result = numbers[0] - numbers[1];
    latexOutput += `${result}\n\\end{array}`;
    
    return latexOutput;
}


function generateMultiplicationSteps(numbers) {
    if (numbers.length < 2) return "\\(\\text{Error: Not enough numbers for multiplication}\\)";
    
    // For two numbers, show the standard multiplication algorithm
    if (numbers.length === 2) {
        let multiplicand = numbers[0];
        let multiplier = numbers[1];
        
        // Convert to strings for digit manipulation
        let multiplicandStr = multiplicand.toString();
        let multiplierStr = multiplier.toString();
        
        // Initialize the array of partial products
        let partialProducts = [];
        let maxLength = 0;
        
        // Calculate each partial product
        for (let i = multiplierStr.length - 1; i >= 0; i--) {
            let digit = parseInt(multiplierStr[i]);
            let product = digit * multiplicand;
            
            // Add zeros for place value
            let shiftedProduct = product.toString() + '0'.repeat(multiplierStr.length - 1 - i);
            maxLength = Math.max(maxLength, shiftedProduct.length);
            
            partialProducts.push({
                digit: digit,
                product: product,
                shiftedProduct: shiftedProduct,
                position: multiplierStr.length - 1 - i
            });
        }
        
        // Format for LaTeX
        let latexOutput = `\\begin{array}{r}\n`;
        latexOutput += `${multiplicandStr} \\\\\n`;
        latexOutput += `\\underline{\\times ${multiplierStr}} \\\\\n`;
        
        // Add each partial product line
        partialProducts.forEach(pp => {
            if (pp.digit !== 0) {  // Skip showing partial products for zero digits
                let spaces = '\\phantom{0}'.repeat(pp.position);
                latexOutput += `${pp.product}${spaces} \\\\\n`;
            }
        });
        
        latexOutput += `\\hline\n${multiplicand * multiplier}\n\\end{array}`;
        
        return latexOutput;
    } 
    // For more than 2 numbers, chain the multiplications
    else {
        let result = numbers[0];
        let steps = [];
        
        for (let i = 1; i < numbers.length; i++) {
            let stepResult = result * numbers[i];
            
            steps.push(`${result} \\times ${numbers[i]} = ${stepResult}`);
            result = stepResult;
        }
        
        return `\\begin{array}{l}\n${steps.join(' \\\\\n')}\n\\end{array}`;
    }
}


function generateLongDivisionSteps(dividend, divisor) {
    // Handle case when divisor is larger than dividend
    if (divisor > dividend) {
        return `\\(${dividend} \\div ${divisor} = 0 \\text{ with remainder } ${dividend}\\)`;
    }
    
    let quotient = Math.floor(dividend / divisor);
    let remainder = dividend % divisor;
    
    // Convert to strings
    let dividendStr = dividend.toString();
    let divisorStr = divisor.toString();
    
    // Calculate long division steps
    let workingDigits = '';
    let steps = [];
    
    for (let i = 0; i < dividendStr.length; i++) {
        workingDigits += dividendStr[i];
        let workingNumber = parseInt(workingDigits);
        
        if (workingNumber < divisor && i < dividendStr.length - 1) {
            // If current working number is less than divisor, bring down next digit
            continue;
        }
        
        // Calculate step values
        let stepQuotient = Math.floor(workingNumber / divisor);
        let stepProduct = stepQuotient * divisor;
        let stepRemainder = workingNumber - stepProduct;
        
        steps.push({
            workingNumber: workingNumber,
            stepQuotient: stepQuotient,
            stepProduct: stepProduct,
            stepRemainder: stepRemainder
        });
        
        // Update working digits to remainder
        workingDigits = stepRemainder.toString();
    }
    
    // Format for LaTeX display
    let latexOutput = `\\begin{array}{r}\n`;
    latexOutput += `${quotient} \\\\\n`;
    latexOutput += `${divisor}\\overline{)${dividend}} \\\\\n`;
    
    steps.forEach(step => {
        latexOutput += `\\underline{-${step.stepProduct}} \\\\\n`;
        latexOutput += `${step.stepRemainder} \\\\\n`;
    });
    
    if (remainder > 0) {
        latexOutput += `\\text{Remainder: } ${remainder}\n`;
    }
    
    latexOutput += `\\end{array}`;
    
    return latexOutput;
}

// Improved answer key generation
function generateAnswerKey() {
    let answers = JSON.parse(sessionStorage.getItem("answers"));
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
                    inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                    displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                    packages: {'[+]': ['enclose']}
                },
                svg: { fontCache: 'global' }
            };
        </script>
        <script async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; }
            .math { margin: 15px 0; }
            .question-container { 
                margin-bottom: 30px; 
                padding: 15px;
                border: 1px solid #eee;
                border-radius: 5px;
            }
            .question-number {
                font-weight: bold;
                margin-bottom: 10px;
            }
            @media print {
                .question-container {
                    page-break-inside: avoid;
                }
            }
        </style>
    </head>
    <body>
        <h1>Answer Key</h1>`;

    answers.forEach((q, i) => {
        let formattedAnswer = q.answer.toLocaleString();
        let solutionLatex = "";

        // Generate solution based on operation type
        switch (q.operation) {
            case "addition":
                solutionLatex = generateAdditionSteps(q.numbers);
                break;

            case "subtraction":
                solutionLatex = generateSubtractionSteps(q.numbers);
                break;

            case "multiplication":
                solutionLatex = generateMultiplicationSteps(q.numbers);
                break;

            case "division":
                if (q.longDivision) {
                    solutionLatex = generateLongDivisionSteps(q.numbers[0], q.numbers[1]);
                } else {
                    solutionLatex = `\\(${q.numbers[0]} \\div ${q.numbers[1]} = ${formattedAnswer}\\)`;
                }
                break;

            default:
                solutionLatex = `\\(\\text{Error: Unknown Operation}\\)`;
                break;
        }

        answerPage += `
        <div class="question-container">
            <div class="question-number">Question ${i + 1}</div>
            <div class="problem">Problem: ${q.questionLatex}</div>
            <div class="math">Solution: $$${solutionLatex}$$</div>
            <div class="answer">Final Answer: ${formattedAnswer}</div>
        </div>`;
    });

    answerPage += `
        <script>
            document.addEventListener("DOMContentLoaded", function() {
                setTimeout(() => {
                    MathJax.typesetPromise();
                }, 500);
            });
        </script>
    </body>
    </html>`;

    let win = window.open("", "_blank");
    win.document.write(answerPage);
    win.document.close();
}

function formatLongDivisionQuestion(dividend, divisor) {
    return `\\[
    ${divisor} \\enclose{longdiv}{${dividend}}
    \\]`;
}
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
        let solutionSpace = '';
        
        switch (operation) {
            case "addition":
                if (orientation === "traditional") {
                    questionLatex = formatAdditionTraditional(numbers);
                } else {
                    questionLatex = `\\(${numbers.join(" + ")}\\)`;
                }
                answer = numbers.reduce((a, b) => a + b, 0);
                // Create space based on the number of digits
                let addSpaceHeight = Math.max(...numbers.map(n => n.toString().length), answer.toString().length) + 3;
                solutionSpace = `<div style="height: ${addSpaceHeight * 20}px;"></div>`;
                break;
                
            case "subtraction":
                if (orientation === "traditional") {
                    questionLatex = formatSubtractionTraditional(numbers);
                } else {
                    questionLatex = `\\(${numbers.join(" - ")}\\)`;
                }
                answer = numbers.reduce((a, b) => a - b);
                // Create space based on the number of digits in the first number and the answer
                let subSpaceHeight = Math.max(numbers[0].toString().length, answer.toString().length) + 3;
                solutionSpace = `<div style="height: ${subSpaceHeight * 20}px;"></div>`;
                break;
                
                
            case "multiplication":
                questionLatex = orientation === "inline" 
                    ? `\\(${numbers.join(" \\times ")}\\)` 
                    : `\\[
                        \\begin{array}{r}
                        ${numbers.slice(0, -1).join(" \\\\ ")} \\\\
                        \\underline{\\times \\ ${numbers[numbers.length - 1]}} \\\\
                        \\end{array}
                    \\]`;
                answer = numbers.reduce((a, b) => a * b, 1);
                
                // Calculate needed space based on total digits in all numbers plus result
                let totalDigits = numbers.reduce((sum, num) => sum + num.toString().length, 0);
                let resultDigits = answer.toString().length;
                let multSpaceHeight = totalDigits + resultDigits + 4;
                
                if (orientation === "inline") {
                    // For inline, provide more vertical space
                    solutionSpace = `<div style="height: ${multSpaceHeight * 20}px;"></div>`;
                } else {
                    // For traditional, some space is already provided by the layout, add less
                    solutionSpace = `<div style="height: ${multSpaceHeight * 15}px;"></div>`;
                }
                break;
                
            case "division":
                numbers.sort((a, b) => b - a);
                let dividend = numbers[0];
                let divisor = numbers[1];

                if (longDivision) {
                    questionLatex = `\\[
                        ${divisor} \\enclose{longdiv}{${dividend}}
                    \\]`;
                    
                    // Long division needs more space, based on digits in dividend and result
                    let divDigits = dividend.toString().length;
                    let quotientDigits = Math.floor(dividend / divisor).toString().length;
                    solutionSpace = `<div style="height: ${(divDigits + quotientDigits + 5) * 25}px;"></div>`;
                } else {
                    questionLatex = `\\(${dividend} \\div ${divisor} = \\underline{\\quad\\quad}\\)`;
                    solutionSpace = `<div style="height: 120px;"></div>`; // Standard space for simple division
                }

                answer = dividend / divisor;
                break;
        }

        answer = parseFloat(answer.toFixed(decimalPlaces));

        // Store the operation type explicitly in each question
        questions.push({ numbers, questionLatex, answer, operation, longDivision, solutionSpace });
    }

    // Store questions with their operations in session storage
    sessionStorage.setItem("answers", JSON.stringify(questions));

    let k = 0;
    for (let i = 0; i < Math.ceil(numQuestions / 3); i++) {
        let row = table.insertRow();
        for (let j = 0; j < 3; j++) {
            if (k >= questions.length) break;
            let cell = row.insertCell();
            
            // Add question number and problem statement
            cell.innerHTML = `<div style="margin-bottom: 8px;"><b>${k + 1}.</b> <span class="math">${questions[k].questionLatex}</span></div>`;
            
            // Add the solution space
            cell.innerHTML += questions[k].solutionSpace;
            
            k++;
        }
    }

    // Add spacing between rows
    for (let i = 0; i < table.rows.length; i++) {
        table.rows[i].style.marginBottom = "40px";
        for (let j = 0; j < table.rows[i].cells.length; j++) {
            table.rows[i].cells[j].style.paddingBottom = "40px";
        }
    }

    // Ensure MathJax processes LaTeX correctly
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}


function formatAdditionTraditional(numbers) {
    // Determine the maximum width (number of characters) among the numbers
    let maxLength = Math.max(...numbers.map(num => num.toString().length));
    // Pad each number so they align to the right
    let padded = numbers.map(num => num.toString().padStart(maxLength, ' '));
    // Build a LaTeX array with the last number marked with a plus sign and an underline
    return `\\[
  \\begin{array}{r}
  ${padded.slice(0, padded.length - 1).join(" \\\\ ")} \\\\
  \\underline{+ ${padded[padded.length - 1]}}
  \\end{array}
  \\]`;
  }
  
  function formatSubtractionTraditional(numbers) {
    // Determine the maximum width among the numbers
    let maxLength = Math.max(...numbers.map(num => num.toString().length));
    let padded = numbers.map(num => num.toString().padStart(maxLength, ' '));
    // For subtraction problems (typically two numbers, but supporting more if needed)
    if (numbers.length === 2) {
      return `\\[
  \\begin{array}{r}
  ${padded[0]} \\\\
  \\underline{- ${padded[1]}}
  \\end{array}
  \\]`;
    } else {
      // If more than 2 numbers, subtract each subsequent term
      return `\\[
  \\begin{array}{r}
  ${padded[0]} \\\\
  \\underline{- ${padded.slice(1).join(" \\\\ - ")}}
  \\end{array}
  \\]`;
    }
  }

const _date = new Date();
document.getElementById("date").innerHTML = `${_date.getDate()}-${_date.getMonth() + 1}-${_date.getFullYear()}`;
