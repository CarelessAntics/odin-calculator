const output = document.querySelector('.calc-out');
const calcBody = document.querySelector('.calc-body');
const calcKeys = document.querySelector('.calc-keys');

// Conversion table for css-invalid button labels and keypresses
const labelToValid = {
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULT',
    '/': 'DIV',
    '+/-': 'NEG',
    '.': 'POINT',
    ',': 'POINT',
    '=': 'EQ',
    'Enter': 'EQ',
    'Backspace': '←',
    '(': 'POPEN',
    ')': 'PCLOSE',
    '\'': 'NONE',
}

// ====================================
// CALCULATOR VISUALS / USER FACING
// ====================================

const resultDisplay = document.createElement('div');
const expressionDisplay = document.createElement('div');

resultDisplay.classList.add("result");
expressionDisplay.classList.add("expression");

output.appendChild(resultDisplay);
output.appendChild(expressionDisplay);

createNumKeys(calcKeys);

calcBody.addEventListener('click', keyClick);
addEventListener('keydown', keyPress);
addEventListener('keyup', event => {
    const label = labelToValid[event.key] || event.key
    const keyID = `#key${label}`;
    const button = document.querySelector(keyID);
    if (button) button.classList.remove("active");
});

function keyClick(event) {
    let target = event.target
    if (target.tagName === 'SPAN'){
        target = target.parentNode;
    }
    if (target.id.includes('key')) {
        const buttonValue = target.firstChild.textContent
        buildFormula(buttonValue, inputExpression);
    }
}

function keyPress(event) {
    if (['/'].includes(event.key)) event.preventDefault();
    buildFormula(event.key, inputExpression);
    const label = labelToValid[event.key] || event.key
    const keyID = `#key${label}`;
    const button = document.querySelector(keyID);
    if (button) button.classList.add("active");
}

function createNumKeys(parentElem) {
    // Current layout generator switches rows after 4 elements
     const buttonLabels = ['(', ')', '←', 'CLR',
                            7, 8, 9, '/',
                            4, 5, 6, '*',
                            1, 2, 3, '-',
                            '+/-', 0, '.', '+',
                            '='
                            ];

    const elementsPerRow = 4;
    let counter = 0;
    let row;

    for (num of buttonLabels) {
        if (counter % elementsPerRow === 0) {
            if (row) {
                parentElem.appendChild(row);
            }
            row = document.createElement('div');
            row.classList.add('key-row');
        }

        let numKey = makeSquare(makeKey(num));
        if (/^[0-9]/.test(num)) {
            numKey.classList.add("num")
            numKey.style.setProperty('--shadow-color', '#ccc')
        }
        if (/^[=]/.test(num)) {
            numKey.classList.add("equals")
            numKey.style.setProperty('--shadow-color', '#abc')
        }
        if (/^[ ]/.test(num)) {
            numKey.classList.add("empty")
        }

        row.appendChild(numKey);
        counter++;
    }

    parentElem.appendChild(row);
}

function makeKey(key) {
    let elem = document.createElement('div');
    let label = labelToValid[key] || key;
    elem.id = `key${label}`;
    elem.classList.add('key');
    elem.innerHTML = `<span>${key}</span>`;

    return elem;
}

function makeSquare(elem) {
    elem.classList.add("aspect-1");
    return elem;
}


// ====================================
// EXPRESSION OBJECT
// ====================================

// Object for storing and building the calculation expression
// Numbers are added to a buffer, and once an operator is selected or a parenthesis added, the buffer is pushed into an array
// Numerical indices contain an array of the current expression at a certain depth
// Depth increases and decreases with parentheses. Increase creates a new key with an empty array. Decrease pushes this array to the previous level
function Expression() {

    return { 
        depth: 0, // Current depth (level of parentheses)
        num: '', // Number buffer
        0: [], // Base level array at depth 0
        display: '', // User readable version of the formula
        supportedOps: ['+', '/', '*', '-'],

        addDigit: function (n){
            this.num += n;
        },

        flipSign: function () {
            if (this.num[0] === '-') {
                this.num = this.num.slice(1);
            } else {
                this.num = '-' + this.num;
            }
        },

        applyNum: function () {
            if (this.num) {
                this[this.depth].push(this.num);
                this.display += `${this.num} `;
                this.num = '';
            }
        },

        addOperator: function (op) {
            this.applyNum();
            this[this.depth].push(op);
            this.display += `${op} `;
            this.num = '';
        },

        changeLastOperator: function (value) {
            this[this.depth].splice(-1, 1, value)
        },

        increaseDepth: function (){
            this.applyNum();
            this.display += '( ';
            this[this.depth + 1] = [];
            this.depth += 1;
        },

        decreaseDepth: function () {
            if (this.depth === 0) {
                console.log("Can't decrease depth past 0!")
                return;
            }
            this.applyNum();
            const current = this.getCurrentArray()

            if (current.length > 0) {
                this[this.depth - 1].push(current);
                this.display += ') ';
            } else {
                // In the case of empty array, parentheses make no sense, so remove the opening parenthesis
                this.display = this.display.slice(0, -2);
            }
            delete current;
            this.depth -= 1;
        },

        getCurrentArray: function () {
            return this[this.depth];
        },

        flatten: function () {
            if (this.supportedOps.includes(this.getCurrentArray().at(-1))) {
                this.getCurrentArray().pop();
            }

            if (this.depth !== 0) {
                for (let i = this.depth; i > 0; i--) {
                    this.decreaseDepth();
                }
            }
        },

        goBackOne: function () {
            // Case: Number buffer is not empty
            if (this.num) {
                this.num = this.num.slice(0, -1);
                return;
            }

            // const displaySymbol = this.display.slice(-2);
            this.display = this.display.slice(0, -2);

            // Case: The last element is an operator
            if (this.supportedOps.includes(this.getCurrentArray().at(-1))) {
                this.getCurrentArray().pop(); // the operator

                // If the new last element is a number (not an array), return it to be editable
                if (!Array.isArray(this.getCurrentArray().at(-1))) {
                    this.num = this.getCurrentArray().pop();
                }
                return;
            }

            // Case: Last element is a complete array
            if (Array.isArray(this.getCurrentArray().at(-1))) {
                this[this.depth + 1] = this.getCurrentArray().pop();
                this.depth += 1;
                this.num = this.getCurrentArray().pop()
                return;
            }

            // Case: We are in an empty sub-array
            if (this.getCurrentArray().length === 0 && this.depth > 0) {
                this.decreaseDepth()
            }
        },

        reset: function () {
            Object.assign(this, Expression());
        }
    }
};

var inputExpression = new Expression();

// ====================================
// CALCULATOR LOGIC
// ====================================

function buildFormula(buttonValue, expressionObj) {
    const operators = expressionObj.supportedOps;

    // Booleans for different actions based on user input
    // This looks disgusting, but I can't think of a way to make it prettier or more readable
    const isOperator            = operators.includes(buttonValue) 
                                    && (expressionObj.num 
                                        || Array.isArray(expressionObj.getCurrentArray().at(-1))); // Either numbers exist in the buffer or we just closed parentheses
    const isOperatorChange      = operators.includes(buttonValue) 
                                    && !expressionObj.num // Current number buffer is empty
                                    && typeof expressionObj.getCurrentArray().at(-1) === 'string' // Previous element is string, a.k.a not an array
                                    && expressionObj.getCurrentArray().length; // Current array isn't empty
    const isDecimalPoint        = (buttonValue === '.' || buttonValue === ',')
                                    && (!expressionObj.num.includes('.')
                                    && !expressionObj.num.includes(','));
    const isDigit               = /^[0-9]+/.test(buttonValue);
    const isOpenParenthesis     = buttonValue === '(';
    const isCloseParenthesis    = buttonValue === ')';
    const isClear               = buttonValue === 'CLR';
    const isNegation            = buttonValue === '+/-';
    const isBackspace           = buttonValue === '<=' 
                                    || buttonValue === 'Backspace'
                                    || buttonValue === '←';
    const isEnter               = buttonValue === '=' 
                                    || buttonValue === 'Enter';

    const allChecks = [ isOperator, 
                        isOperatorChange, 
                        isDecimalPoint, 
                        isDigit, 
                        isOpenParenthesis, 
                        isCloseParenthesis,
                        isClear,
                        isNegation,
                        isBackspace,
                        isEnter,
                        ];

    // Only accept valid checks
    if (!allChecks.some(item => item)) return;

    if (isOperator) {
        expressionObj.addOperator(buttonValue);

    } else if (isOperatorChange) {
        expressionObj.changeLastOperator(buttonValue);

    } else if (isDecimalPoint) {
        if (expressionObj.num) {
            expressionObj.addDigit('.');
        } else {
            expressionObj.addDigit(0);
            expressionObj.addDigit('.');
        }
        
    } else if (isDigit) {
        expressionObj.addDigit(buttonValue);

    } else if (isOpenParenthesis) {
        expressionObj.applyNum();

        // If no operator is added before parenthesis, treat it as multiplication
        if (!operators.includes(expressionObj.getCurrentArray().at(-1)) && expressionObj.getCurrentArray().length) {
            expressionObj.addOperator('*');
        }
        expressionObj.increaseDepth();

    } else if (isCloseParenthesis) {
        expressionObj.applyNum();
        if (!operators.includes(expressionObj.getCurrentArray().at(-1))) {
            expressionObj.decreaseDepth();
        }
    
    } else if (isNegation) {
        expressionObj.flipSign();

    } else if (isClear) {
        expressionObj.flatten();
        expressionObj.reset();

    } else if (isBackspace) {
        expressionObj.goBackOne()
    }

    resultDisplay.textContent = expressionObj.num;
    expressionDisplay.textContent = expressionObj.display;

    if (isEnter) {
        expressionObj.applyNum();
        expressionObj.flatten();
        resultDisplay.textContent = parseExpression(expressionObj.getCurrentArray());
        expressionDisplay.textContent = expressionObj.display + ' =';
        // expressionObj = new Expression();
        expressionObj.reset();
    }
}

// Recursively walk through the expression, collapsing the nested arrays to single values and finally operating on the resulting non-nested array
function parseExpression(arr) {
    if (!arr.some(item => Array.isArray(item))) {
        return operate(arr);
    }

    let arrayLocations = arr.reduce((acc, item, i) => {
        if (Array.isArray(item)) acc.push(i);
        return acc;
    }, []);

    for (let loc of arrayLocations) {
        let result = parseExpression(arr[loc]);
        if (typeof result === 'string') return result; // Division by zero
        arr.splice(loc, 1, result);
    }

    return operate(arr)
}

// Operate on a non-nested array
function operate(arr) {
    // Deal with operators in 2 passes to follow PEMDAS. First mult/div, then add/sub
    // Get the indices of operators we're currently dealing with, then subtract 0, 2, 4, etc to avoid mutating the array while looping through it due to future splice operations
    const operators = [['*', '/'], ['+', '-']];
    for (let op of operators) {
        let operatorIndices = arr.reduce((acc, item, i) => {
            if (op.includes(item)) acc.push(i);
            return acc;
        }, []).map((item, i) => item - 2 * i);

        // Perform the calculations. Go over operators in order from left to right, and perform the operations on the elements on left and right sides
        for (let index of operatorIndices) {
            const operator = arr[index];
            const left = parseFloat(arr[index - 1]);
            const right = parseFloat(arr[index + 1]);
            let result;

            switch (operator) {
                case '*':
                    result = left * right;
                    break;
                
                case '/':
                    if (right === 0) {
                        return "You fool! You've doomed us all! (Division by zero)";
                    }
                    result = left / right;
                    break;
                    
                case '+':
                    result = left + right;
                    break;

                case '-':
                    result = left - right;
                    break;
            }
            // Then remove the elements of the operation and replace with result
            arr.splice(index - 1, 3, result);
        }
    }
    // If all has gone correctly, the array should only contain one value as designed
    return arr[0];
}


