const output = document.querySelector('.calc-out');
const calcBody = document.querySelector('.calc-body');
const calcKeys = document.querySelector('.calc-keys');

const clearKey = makeKey("CLEAR");
const equalsKey = makeKey("=");

calcKeys.appendChild(clearKey);
calcKeys.appendChild(createNumKeys());
calcKeys.appendChild(equalsKey);


//calcKeys.appendChild(createOperatorKeys());


function createNumKeys() {
    // [9, 8, 7, ... 2, 1, ' ', 0, ',']
    const numbers = [...Array(12).keys()]
                                 .reverse()
                                 .map(item => item - 2)
                                 .toSpliced(-3, 3, ' ', 0, ',');

    // Add the operator keys to the number array
    const operators = ['+', '/', '*', '-'];
    for (let i = 0; i < operators.length; i++) {
        const spliceIndex = i*3 + i;
        numbers.splice(spliceIndex, 0, operators[i])
    }
    console.log(numbers)

    let counter = 0;
    let row;

    const numberKeys = document.createElement('div')

    console.log(numbers)
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
        console.log(num)
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