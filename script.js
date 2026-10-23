
/* ========================================
   EyadCode Calculator
   Safe Arithmetic Engine
======================================== */

const calculator = document.querySelector(".calculator");
const display = document.querySelector("[data-display]");
const expressionDisplay = document.querySelector("[data-expression]");

const buttons = document.querySelector(".calculator__buttons");

const OPERATORS = ["+", "-", "*", "/", "%"];

let expression = "";
let resultShown = false;
let hasError = false;

/* ========================================
   Display Helpers
======================================== */

function renderDisplay() {
    display.textContent = expression || "0";
}

function renderExpression(value = "") {
    expressionDisplay.textContent = value;
}

function resetCalculator() {
    expression = "";
    resultShown = false;
    hasError = false;

    renderDisplay();
    renderExpression();
}

function showError(message = "خطأ") {
    display.textContent = message;
    renderExpression(expression);

    expression = "";
    resultShown = false;
    hasError = true;
}

function formatResult(value) {
    if (!Number.isFinite(value)) {
        throw new Error("نتيجة غير صالحة");
    }

    if (Object.is(value, -0)) {
        value = 0;
    }

    // تجنّب ظهور الكسور العشرية الطويلة الناتجة عن
    // دقة الأعداد العائمة في JavaScript.
    return String(Number(value.toPrecision(12)));
}

/* ========================================
   Input Handling
======================================== */

function appendNumber(value) {
    if (hasError) {
        resetCalculator();
    }

    if (resultShown) {
        expression = "";
        resultShown = false;
        renderExpression();
    }

    const lastCharacter = expression.slice(-1);

    // ابدأ بصفر عند إدخال فاصلة عشرية في بداية الرقم.
    if (value === ".") {
        if (!expression || OPERATORS.includes(lastCharacter)) {
            expression += "0.";
            renderDisplay();
            return;
        }

        const currentNumber = expression.split(/[+\-*/%]/).pop();

        if (currentNumber.includes(".")) {
            return;
        }

        expression += ".";
        renderDisplay();
        return;
    }

    // استبدال الصفر الابتدائي بدل إضافة أصفار غير ضرورية.
    if (lastCharacter === "0") {
        const previousCharacter = expression.at(-2);

        if (
            expression.length === 1 ||
            OPERATORS.includes(previousCharacter)
        ) {
            expression = expression.slice(0, -1) + value;
            renderDisplay();
            return;
        }
    }

    expression += value;
    renderDisplay();
}

function appendOperator(operator) {
    if (hasError) {
        resetCalculator();
    }

    if (!expression) {
        // السماح بإدخال إشارة السالب لبدء عدد سالب.
        if (operator === "-") {
            expression = "-";
            renderDisplay();
        }

        return;
    }

    if (resultShown) {
        resultShown = false;
    }

    const lastCharacter = expression.slice(-1);

    if (lastCharacter === ".") {
        return;
    }

    if (OPERATORS.includes(lastCharacter)) {
        // السماح بالسالب بعد عملية ضرب أو قسمة أو باقي قسمة.
        if (
            operator === "-" &&
            ["*", "/", "%"].includes(lastCharacter)
        ) {
            expression += operator;
            renderDisplay();
            return;
        }

        // لا تستبدل إشارة السالب التي تمثل عدداً سالباً.
        if (
            lastCharacter === "-" &&
            expression.length > 1 &&
            ["*", "/", "%"].includes(expression.at(-2))
        ) {
            return;
        }

        expression = expression.slice(0, -1) + operator;
    } else {
        expression += operator;
    }

    renderDisplay();
}

function deleteLastCharacter() {
    if (hasError) {
        resetCalculator();
        return;
    }

    if (resultShown) {
        resetCalculator();
        return;
    }

    expression = expression.slice(0, -1);

    renderDisplay();
}

/* ========================================
   Safe Expression Parser
   Supports + - * / %
======================================== */

function calculate(expressionText) {
    const tokens = expressionText.match(
        /(?:\d+(?:\.\d*)?|\.\d+)|[+\-*/%]/g
    );

    if (!tokens || tokens.join("") !== expressionText) {
        throw new Error("عملية غير صالحة");
    }

    let position = 0;

    function parseExpression() {
        let value = parseTerm();

        while (
            tokens[position] === "+" ||
            tokens[position] === "-"
        ) {
            const operator = tokens[position++];
            const right = parseTerm();

            value = operator === "+"
                ? value + right
                : value - right;
        }

        return value;
    }

    function parseTerm() {
        let value = parseUnary();

        while (
            tokens[position] === "*" ||
            tokens[position] === "/" ||
            tokens[position] === "%"
        ) {
            const operator = tokens[position++];
            const right = parseUnary();

            if (
                (operator === "/" || operator === "%") &&
                right === 0
            ) {
                throw new Error("لا يمكن القسمة على صفر");
            }

            if (operator === "*") {
                value *= right;
            } else if (operator === "/") {
                value /= right;
            } else {
                value %= right;
            }
        }

        return value;
    }

    function parseUnary() {
        if (tokens[position] === "+") {
            position++;
            return parseUnary();
        }

        if (tokens[position] === "-") {
            position++;
            return -parseUnary();
        }

        return parseNumber();
    }

    function parseNumber() {
        const token = tokens[position++];

        if (
            token === undefined ||
            !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token)
        ) {
            throw new Error("عملية غير مكتملة");
        }

        const number = Number(token);

        if (!Number.isFinite(number)) {
            throw new Error("رقم غير صالح");
        }

        return number;
    }

    const result = parseExpression();

    if (position !== tokens.length) {
        throw new Error("عملية غير مكتملة");
    }

    return result;
}

/* ========================================
   Calculate Result
======================================== */

function calculateResult() {
    if (hasError || !expression) {
        return;
    }

    const lastCharacter = expression.slice(-1);

    // لا تحسب إذا انتهت العملية بمشغّل أو نقطة.
    if (OPERATORS.includes(lastCharacter) || lastCharacter === ".") {
        return;
    }

    const originalExpression = expression;

    try {
        const result = calculate(originalExpression);
        const formattedResult = formatResult(result);

        renderExpression(originalExpression);
        expression = formattedResult;

        display.textContent = formattedResult;
        resultShown = true;
        hasError = false;
    } catch (error) {
        showError(
            error.message === "لا يمكن القسمة على صفر"
                ? "قسمة على صفر"
                : "عملية غير صالحة"
        );
    }
}

/* ========================================
   Button Events
======================================== */

buttons.addEventListener("click", (event) => {
    const button = event.target.closest("button");

    if (!button || !buttons.contains(button)) {
        return;
    }

    const { action, value } = button.dataset;

    if (action === "clear") {
        resetCalculator();
        return;
    }

    if (action === "delete") {
        deleteLastCharacter();
        return;
    }

    if (action === "calculate") {
        calculateResult();
        return;
    }

    if (/^\d$/.test(value ?? "")) {
        appendNumber(value);
        return;
    }

    if (value === ".") {
        appendNumber(value);
        return;
    }

    if (OPERATORS.includes(value)) {
        appendOperator(value);
    }
});

/* ========================================
   Keyboard Support
======================================== */

document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (/^\d$/.test(key)) {
        appendNumber(key);
        return;
    }

    if (key === ".") {
        appendNumber(".");
        return;
    }

    if (OPERATORS.includes(key)) {
        appendOperator(key);
        return;
    }

    if (key === "Enter" || key === "=") {
        event.preventDefault();
        calculateResult();
        return;
    }

    if (key === "Backspace") {
        event.preventDefault();
        deleteLastCharacter();
        return;
    }

    if (key === "Escape" || key === "Delete") {
        resetCalculator();
    }
});

/* ========================================
   Initialize
======================================== */

resetCalculator();
