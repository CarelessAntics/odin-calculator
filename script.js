const output = document.querySelector('.calc-out');
const calcBody = document.querySelector('.calc-body');
const calcKeys = document.querySelector('.calc-keys');

// Object for storing and building the calculation formula
// Numerical indices contain an array of the current formula at a certain depth
// Depth increases and decreases with parentheses. Increase creates a new key with an empty array. Decrease pushes this array to the previous level
var Formula = {
    depth: 0,
    num: '',
    0: [],

    addDigit: function (n){
        this.num += n;
    },

    addOperator: function (op) {
        this[this.depth].push(this.num);
        this[this.depth].push(op);
        this.num = '';
    },

    changeLast: function (value) {
        this[this.depth].splice(-1, 1, buttonValue)
    },

    increaseDepth: function (){
        if (this.num) {
            this[this.depth].push(this.num);
            this.num = ''
        }
        this[this.depth + 1] = [];
        this.depth += 1;
    },

    decreaseDepth: function () {
        if (this.depth === 0) {
            console.log("Can't decrease depth past 0!")
            return;
        }

        if (this.num) {
            this[this.depth].push(this.num);
            this.num = ''
        }

        this[this.depth - 1].push(this[this.depth]);
        delete this[this.depth];
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
};

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
calcBody.addEventListener('click', buildFormula);

// Idea is the following:
// Build a formula as a list of strings. Number keys increment current number string, operator keys push the current string to an array
// Parentheses create a new array inside? Then the arrays are parsed from the inside out according to PEMDAS
function buildFormula(event) {
    //event.stopPropagation();
    const target = event.target

    if (target.id.includes('key')) {
        const buttonValue = target.firstChild.textContent
        const operators = ['+', '/', '*', '-']

        // Booleans for different actions based on user input
        const isOperator = operators.includes(buttonValue) && Formula.num;
        const isOperatorChange = operators.includes(buttonValue) // is operator
                                && !Formula.num // Current number string is empty
                                && typeof Formula.getCurrent().at(-1) === 'string' // Previous element is string, a.k.a not an array
                                && Formula.getCurrent().length; // Current array isn't empty
        const isDecimal = buttonValue === '.' && !Formula.num.includes('.');
        const isDigit = /[0-9]+/.test(buttonValue);
        const isOpenParenthesis = buttonValue === '(';
        const isCloseParenthesis = buttonValue === ')' && !operators.includes(Formula.getCurrent().at(-1)); // Last element isn't an operator

        if (isOperator) {
            Formula.addOperator(buttonValue);
            console.log(Formula.getCurrent());

        } else if (isOperatorChange) {
            Formula.changeLast(buttonValue);
            console.log(Formula.getCurrent());

        } else if (isDecimal) {
            Formula.addDigit(buttonValue);
            console.log(Formula.num);

        } else if (isDigit) {
            Formula.addDigit(buttonValue);
            console.log(Formula.num);

        } else if (isOpenParenthesis) {
            // If no operator is added before parenthesis, treat it as multiplication
            if (!operators.includes(Formula.getCurrent().at(-1))) {
                Formula.addOperator('*');
            }
            Formula.increaseDepth();
            console.log(Formula.getCurrent());
            console.log(Formula.num);

        } else if (isCloseParenthesis) {
            Formula.decreaseDepth();
            console.log(Formula.getCurrent());
            console.log(Formula.num);

        } else if (buttonValue === 'CLEAR') {
            // TODO Reset the Formula

        } else if (buttonValue === '=') {
            // TODO Parse Formula and print out the result

        }
        
    }
}


function createNumKeys() {
    // [9, 8, 7, ... 2, 1, ' ', 0, ',']
    const numbers = [...Array(12).keys()]
                                 .reverse()
                                 .map(item => item - 2)
                                 .toSpliced(-3, 3, ' ', 0, '.');

    // Add the operator keys to the number array
    const operators = ['+', '/', '*', '-'];
    for (let i = 0; i < operators.length; i++) {
        const spliceIndex = i*3 + i;
        numbers.splice(spliceIndex, 0, operators[i])
    }

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

        row.insertBefore(numKey, row.firstChild);
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
    elem.innerHTML = `<p>${key}</p>`;

    return elem;
}

function makeSquare(elem) {
    elem.classList.add("aspect-1");
    return elem;
}