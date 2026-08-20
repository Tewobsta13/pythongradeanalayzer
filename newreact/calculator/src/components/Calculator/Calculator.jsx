import { useState } from "react";
import "./Calculator.css";

import Display from "../Display/Display";
import Keypad from "../Keypad/Keypad";

function Calculator() {
  const [display, setDisplay] = useState("0");
  const [firstNumber, setFirstNumber] = useState(null);
  const [operator, setOperator] = useState(null);

  function handleButtonClick(value) {
    // Clear
    if (value === "C") {
      setDisplay("0");
      setFirstNumber(null);
      setOperator(null);
      return;
    }

    // Numbers
    if (!["+", "-", "*", "/", "="].includes(value)) {
      setDisplay((currentDisplay) => {
        if (currentDisplay === "0") {
          return value;
        }

        return currentDisplay + value;
      });

      return;
    }

    // Operator
    if (["+", "-", "*", "/"].includes(value)) {
      setFirstNumber(Number(display));
      setOperator(value);
      setDisplay("0");
      return;
    }

    // Equals
    if (value === "=") {
      if (firstNumber === null || operator === null) {
        return;
      }

      const secondNumber = Number(display);
      let result;

      if (operator === "+") {
        result = firstNumber + secondNumber;
      } else if (operator === "-") {
        result = firstNumber - secondNumber;
      } else if (operator === "*") {
        result = firstNumber * secondNumber;
      } else if (operator === "/") {
        result = firstNumber / secondNumber;
      }

      setDisplay(String(result));
      setFirstNumber(null);
      setOperator(null);
    }
  }

  return (
    <div className="calculator">
      <Display value={display} />

      <Keypad onButtonClick={handleButtonClick} />
    </div>
  );
}

export default Calculator;
