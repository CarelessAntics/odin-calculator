const output = document.querySelector('.calc-out');
const calcBody = document.querySelector('.calc-body');
const calcKeys = document.querySelector('.calc-keys');

// TODO output section for the calculator
// TODO make pretty

// ====================================
// CALCULATOR VISUALS / USER FACING
// ====================================

const numKeys = createNumKeys();
const equalsKey = makeKey("=");

calcKeys.appendChild(numKeys);
calcKeys.appendChild(equalsKey);

calcBody.addEventListener('click', keyClick);
addEventListener('keydown', keyPress);

function keyClick(event) {
    let target = event.target
    if (target.tagName === 'SPAN'){
        target = target.parentNode;
    }
    if (target.id.includes('key')) {
        const buttonValue = target.firstChild.textContent
        buildFormula(buttonValue);
    }
}


function keyPress(event) {
    buildFormula(event.key);
}


function createNumKeys() {
    // Current layout generator switches rows after 4 elements
     const numbers = ['(', ')', '<=', 'CLEAR',
                      7, 8, 9, '/',
                      4, 5, 6, '*',
                      1, 2, 3, '-',
                      ' ', 0, '.', '+'];

    const elementsPerRow = 4
    let counter = 0;
    let row;
    const numberKeys = document.createElement('div')

    for (num of numbers) {
        if (counter % elementsPerRow === 0) {
            if (row) {
                numberKeys.appendChild(row);
            }
            row = document.createElement('div');
            row.classList.add('key-row');
        }

        let numKey = makeSquare(makeKey(num));
        row.appendChild(numKey);
        counter++;
    }
    numberKeys.appendChild(row);
    //calcKeys.appendChild(numberKeys);

    return numberKeys
}

function makeKey(key) {
    let elem = document.createElement('div');
    elem.id = `key${key}`;
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

        addDigit: function (n){
            this.num += n;
        },

        applyNum: function () {
            if (this.num) {
                this[this.depth].push(this.num);
                this.num = ''
            }
        },

        addOperator: function (op) {
            this.applyNum();
            this[this.depth].push(op);
            this.num = '';
        },

        changeLast: function (value) {
            this[this.depth].splice(-1, 1, value)
        },

        increaseDepth: function (){
            this.applyNum();
            this[this.depth + 1] = [];
            this.depth += 1;
        },

        decreaseDepth: function () {
            if (this.depth === 0) {
                console.log("Can't decrease depth past 0!")
                return;
            }
            this.applyNum();
            const current = this.getCurrent()

            if (current.length > 0) {
                this[this.depth - 1].push(current);
            }
            delete current;
            this.depth -= 1;
        },

        getCurrent: function () {
            return this[this.depth];
        },

        flatten: function () {
            if (this.depth !== 0) {
                for (let i = this.depth; i > 0; i--) {
                    this.decreaseDepth()
                }
            }
        }
    }
};

var inputExpression = new Expression();

// ====================================
// CALCULATOR LOGIC
// ====================================

function buildFormula(buttonValue) {
    const operators = ['+', '/', '*', '-']

    // Booleans for different actions based on user input
    const isOperator = operators.includes(buttonValue) 
                       && (inputExpression.num || Array.isArray(inputExpression.getCurrent().at(-1))); // Either numbers exist in the buffer or we just closed parentheses
    const isOperatorChange = operators.includes(buttonValue) // is operator
                            && !inputExpression.num // Current number buffer is empty
                            && typeof inputExpression.getCurrent().at(-1) === 'string' // Previous element is string, a.k.a not an array
                            && inputExpression.getCurrent().length; // Current array isn't empty
    const isDecimalPoint = (buttonValue === '.' || buttonValue === ',') // I'm a European heathen who allows commas as decimal separators
                            && !inputExpression.num.includes('.'); // Does the number already have a decimal point in it
    const isDigit = /[0-9]+/.test(buttonValue);
    const isOpenParenthesis = buttonValue === '(';
    const isCloseParenthesis = buttonValue === ')';

    if (isOperator) {
        inputExpression.addOperator(buttonValue);
        console.log(inputExpression.getCurrent());

    } else if (isOperatorChange) {
        inputExpression.changeLast(buttonValue);
        console.log(inputExpression.getCurrent());

    } else if (isDecimalPoint) {
        inputExpression.addDigit(buttonValue);
        console.log(inputExpression.num);

    } else if (isDigit) {
        inputExpression.addDigit(buttonValue);
        console.log(inputExpression.num);

    } else if (isOpenParenthesis) {
        inputExpression.applyNum();

        // If no operator is added before parenthesis, treat it as multiplication
        if (!operators.includes(inputExpression.getCurrent().at(-1)) && inputExpression.getCurrent().length) {
            inputExpression.addOperator('*');
        }
        inputExpression.increaseDepth();
        console.log(inputExpression.getCurrent());
        console.log(inputExpression.num);

    } else if (isCloseParenthesis) {
        inputExpression.applyNum();
        if (!operators.includes(inputExpression.getCurrent().at(-1))) {
            inputExpression.decreaseDepth();
        }
        console.log(inputExpression.getCurrent());
        console.log(inputExpression.num);

    } else if (buttonValue === 'CLEAR') {
        inputExpression = new Expression();

    } else if (buttonValue === '=' || buttonValue === 'Enter') {
        // TODO Parse inputExpression and print out the result
        inputExpression.applyNum();
        inputExpression.flatten();
        let result = parseDepths(inputExpression.getCurrent())
        console.log(result)
        inputExpression = new Expression();
    }
}

function parseDepths(arr) {
    
    if (!arr.some(item => Array.isArray(item))) {
        return parseSingleDepth(arr);
    }

    let arrayIndices = arr.reduce((acc, item, i) => {
        if (Array.isArray(item)) acc.push(i);
        return acc;
    }, []);

    for (let index of arrayIndices) {
        let result = parseDepths(arr[index]);
        arr.splice(index, 1, result);
    }

    return parseSingleDepth(arr)

    // PEMDAS: parentheses -> (exponents) -> multiplication/division -> addition/subtraction
    // First pass: resolve parentheses
    // recursively:
    //      If array contains arrays
    //      get arrays and indices
    //      loop over arrays and execute this function on them 

}

// Single operation: 
// find next operator
// perform operation on elements left and right
function parseSingleDepth(arr) {
    const operators = [['*', '/'], ['+', '-']];

    // Deal with operators in 2 passes to follow PEMDAS. First mult/div, then add/sub
    // Get the indices of operators we're currently dealing with, then progressively subtract 2 to account for future splice operations
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
    // If all has gone correctly, the array should only contain one value by design
    // console.log(arr)
    return arr[0];
}


