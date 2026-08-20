import "./Keypad.css";
import Button from "../Button/Button";

function Keypad({ onButtonClick }) {
  return (
    <div className="keypad">
      <Button value="7" onClick={() => onButtonClick("7")} />
      <Button value="8" onClick={() => onButtonClick("8")} />
      <Button value="9" onClick={() => onButtonClick("9")} />
      <Button value="/" onClick={() => onButtonClick("/")} />

      <Button value="4" onClick={() => onButtonClick("4")} />
      <Button value="5" onClick={() => onButtonClick("5")} />
      <Button value="6" onClick={() => onButtonClick("6")} />
      <Button value="*" onClick={() => onButtonClick("*")} />

      <Button value="1" onClick={() => onButtonClick("1")} />
      <Button value="2" onClick={() => onButtonClick("2")} />
      <Button value="3" onClick={() => onButtonClick("3")} />
      <Button value="-" onClick={() => onButtonClick("-")} />

      <Button value="0" onClick={() => onButtonClick("0")} />
      <Button value="C" onClick={() => onButtonClick("C")} />
      <Button value="=" onClick={() => onButtonClick("=")} />
      <Button value="+" onClick={() => onButtonClick("+")} />
    </div>
  );
}

export default Keypad;
