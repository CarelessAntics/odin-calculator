const output = document.querySelector('.calc-out');
const calcBody = document.querySelector('.calc-body');
const calcKeys = document.querySelector('.calc-keys');

// Object for storing and building the calculation formula
// Numerical indices contain an array of the current formula at a certain depth
// Depth increases and decreases with parentheses. Increase creates a new key with an empty array. Decrease pushes this array to the previous level
function Formula() {

    return { depth: 0,
        num: '',
        0: [],

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

var formula = new Formula();

// Build the calculator in JS:

// Top row of buttons
const topRow = document.createElement('div');
topRow.classList.add('key-row');

const parenthesisL = makeSquare(makeKey("("))
const parenthesisR = makeSquare(makeKey(")"))
const clearKey = makeKey("CLEAR");
clearKey.style.flexGrow = 4;

topRow.appendChild(parenthesisL);
topRow.appendChild(parenthesisR);
topRow.appendChild(clearKey);

// Numbers and operators in the middle
const numKeys = createNumKeys();

// Equals key at the bottom
const equalsKey = makeKey("=");

calcKeys.appendChild(topRow);
calcKeys.appendChild(numKeys);
calcKeys.appendChild(equalsKey);


// Buttonclicks
calcBody.addEventListener('click', keyClick);
addEventListener('keydown', keyPress);

// Idea is the following:
// Build a formula as a list of strings. Number keys increment current number string, operator keys push the current string to an array
// Parentheses create a new array inside? Then the arrays are parsed from the inside out according to PEMDAS
function keyClick(event) {
    // TODO split into functions that can also work with keypresses
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


function buildFormula(buttonValue) {
    const operators = ['+', '/', '*', '-']

    // Booleans for different actions based on user input
    const isOperator = operators.includes(buttonValue) && formula.num;
    const isOperatorChange = operators.includes(buttonValue) // is operator
                            && !formula.num // Current number string is empty
                            && typeof formula.getCurrent().at(-1) === 'string' // Previous element is string, a.k.a not an array
                            && formula.getCurrent().length; // Current array isn't empty
    const isDecimal = buttonValue === '.' && !formula.num.includes('.');
    const isDigit = /[0-9]+/.test(buttonValue);
    const isOpenParenthesis = buttonValue === '(';
    const isCloseParenthesis = buttonValue === ')' && !operators.includes(formula.getCurrent().at(-1)); // Last element isn't an operator

    if (isOperator) {
        formula.addOperator(buttonValue);
        console.log(formula.getCurrent());

    } else if (isOperatorChange) {
        formula.changeLast(buttonValue);
        console.log(formula.getCurrent());

    } else if (isDecimal) {
        formula.addDigit(buttonValue);
        console.log(formula.num);

    } else if (isDigit) {
        formula.addDigit(buttonValue);
        console.log(formula.num);

    } else if (isOpenParenthesis) {
        formula.applyNum();

        // If no operator is added before parenthesis, treat it as multiplication
        if (!operators.includes(formula.getCurrent().at(-1)) && formula.getCurrent().length) {
            formula.addOperator('*');
        }
        formula.increaseDepth();
        console.log(formula.getCurrent());
        console.log(formula.num);

    } else if (isCloseParenthesis) {
        formula.decreaseDepth();
        console.log(formula.getCurrent());
        console.log(formula.num);

    } else if (buttonValue === 'CLEAR') {
        formula = new Formula();

    } else if (buttonValue === '=') {
        // TODO Parse formula and print out the result
        formula.applyNum();
        formula.flatten();
        parseDepths(formula.getCurrent())
        formula = new Formula();

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
    console.log(arr)
    return arr[0];
}

function createNumKeys() {
     const numbers = [7, 8, 9, '/',
                      4, 5, 6, '*',
                      1, 2, 3, '-',
                      ' ', 0, '.', '+']

    let counter = 0;
    let row;

    const numberKeys = document.createElement('div')

    for (num of numbers) {
        if (counter % 4 === 0) {
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