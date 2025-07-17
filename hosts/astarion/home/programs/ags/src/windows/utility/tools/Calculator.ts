/**
 * █▀▀ ▄▀█ █░░ █▀▀ █░█ █░░ ▄▀█ ▀█▀ █▀█ █▀█
 * █▄▄ █▀█ █▄▄ █▄▄ █▄█ █▄▄ █▀█ ░█░ █▄█ █▀▄
 *
 * A calculator. A little buggy.
 *
 * I have to be honest, this was vibe coded.
 *
 * @TODO Should auto-grab focus when utility panel is opened, not just on creation
 */

/*****************************************************************************
 * Imports
 *****************************************************************************/

import { Gdk, Gtk, Widget } from "astal/gtk4";
import { Variable, GLib, bind } from "astal";
import Pango from "gi://Pango?version=1.0";

/*****************************************************************************
 * Constants
 *****************************************************************************/

const CSS_CLASSES = {
  calculator: "calculator",
  display: "calculator-display",
  displayContainer: "display-container",
  expression: "expression-display",
  result: "result-display",
  historyIndicator: "history-indicator",
  buttonGrid: "button-grid",
  button: "calc-button",
  buttonNumber: "calc-button-number",
  buttonOperator: "calc-button-operator",
  buttonSpecial: "calc-button-special",
  buttonEquals: "calc-button-equals",
  buttonClear: "calc-button-clear",
  buttonFunction: "calc-button-function",
  memoryIndicator: "memory-indicator",
  errorState: "error-state",
  successState: "success-state",
} as const;

const BUTTON_LAYOUT = [
  // Row 1: Memory and clear functions
  [
    { text: "MC", type: "memory" },
    { text: "MR", type: "memory" },
    { text: "M+", type: "memory" },
    { text: "M-", type: "memory" },
  ],
  // Row 2: Advanced functions
  [
    { text: "√", type: "function", action: "sqrt" },
    { text: "x²", type: "function", action: "square" },
    {
      text: "1/x",
      type: "function",
      action: "reciprocal",
    },
    { text: "C", type: "clear" },
  ],
  // Row 3: Numbers and basic operations
  [
    { text: "7", type: "number" },
    { text: "8", type: "number" },
    { text: "9", type: "number" },
    { text: "÷", type: "operator", action: "/" },
  ],
  // Row 4
  [
    { text: "4", type: "number" },
    { text: "5", type: "number" },
    { text: "6", type: "number" },
    { text: "×", type: "operator", action: "*" },
  ],
  // Row 5
  [
    { text: "1", type: "number" },
    { text: "2", type: "number" },
    { text: "3", type: "number" },
    { text: "−", type: "operator", action: "-" },
  ],
  // Row 6
  [
    { text: "0", type: "number", span: 2 },
    { text: ".", type: "number" },
    { text: "+", type: "operator" },
  ],
  // Row 7
  [
    {
      text: "⌫",
      type: "special",
      action: "backspace",
      span: 2,
    },
    { text: "=", type: "equals", span: 2 },
  ],
] as const;

const MATH_FUNCTIONS = {
  sqrt: (x: number) => Math.sqrt(x),
  square: (x: number) => x * x,
  reciprocal: (x: number) => 1 / x,
  sin: (x: number) => Math.sin(x),
  cos: (x: number) => Math.cos(x),
  tan: (x: number) => Math.tan(x),
  log: (x: number) => Math.log10(x),
  ln: (x: number) => Math.log(x),
} as const;

const KEYBOARD_SHORTCUTS = {
  [Gdk.KEY_Return]: "=",
  [Gdk.KEY_KP_Enter]: "=",
  [Gdk.KEY_Escape]: "clear",
  [Gdk.KEY_BackSpace]: "backspace",
  [Gdk.KEY_Delete]: "clear",
  [Gdk.KEY_plus]: "+",
  [Gdk.KEY_minus]: "-",
  [Gdk.KEY_asterisk]: "*",
  [Gdk.KEY_slash]: "/",
  [Gdk.KEY_period]: ".",
  [Gdk.KEY_Up]: "history_up",
  [Gdk.KEY_Down]: "history_down",
} as const;

/*****************************************************************************
 * Type definitions
 *****************************************************************************/

interface ButtonConfig {
  text: string;
  type:
    | "number"
    | "operator"
    | "function"
    | "special"
    | "equals"
    | "clear"
    | "memory";
  action?: string;
  span?: number;
}

/*****************************************************************************
 * State management
 *****************************************************************************/

/** Calculator state reactive variables */
const calculatorState = {
  expression: Variable(""),
  result: Variable("0"),
  memory: Variable(0),
  history: Variable<string[]>([]),
  historyIndex: Variable(0),
  isError: Variable(false),
  isSuccess: Variable(false),
} as const;

/*****************************************************************************
 * Utility functions
 *****************************************************************************/

/**
 * Safely evaluates mathematical expressions with enhanced security.
 * @param expression - Mathematical expression to evaluate
 * @returns Calculated result
 */
const safelyEvaluateExpression = (expression: string): number => {
  // Remove display symbols and convert to JS operators
  const cleanedExpression = expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .trim();

  // Enhanced security check
  if (!/^[0-9+\-*/().\s]+$/.test(cleanedExpression)) {
    throw new Error("Invalid characters detected");
  }

  // Prevent potential security issues
  if (
    cleanedExpression.includes("__") ||
    cleanedExpression.includes("constructor")
  ) {
    throw new Error("Security violation detected");
  }

  // Use Function constructor for safe evaluation
  try {
    const result = Function(`"use strict"; return (${cleanedExpression})`)();

    if (!isFinite(result)) {
      throw new Error("Result is not finite");
    }

    return result;
  } catch (error) {
    throw new Error("Calculation error");
  }
};

/**
 * Formats numbers for display with appropriate precision.
 * @param value - Numeric value to format
 * @returns Formatted string
 */
const formatDisplayNumber = (value: number): string => {
  if (!isFinite(value)) return "Error";

  // Handle very large or very small numbers
  if (Math.abs(value) >= 1e10 || (Math.abs(value) < 1e-6 && value !== 0)) {
    return value.toExponential(6);
  }

  // Regular formatting with appropriate decimal places
  const formatted = value.toString();
  return formatted.length > 12 ? value.toPrecision(8) : formatted;
};

/*****************************************************************************
 * Calculator operations
 *****************************************************************************/

/**
 * Handles number input and decimal points.
 * @param digit - The digit or decimal point to add
 */
const handleNumberInput = (digit: string): void => {
  const currentExpression = calculatorState.expression.get();

  // Prevent multiple decimal points in the same number
  if (digit === ".") {
    const lastNumber = currentExpression.split(/[+\-*/]/).pop() || "";
    if (lastNumber.includes(".")) return;
  }

  calculatorState.expression.set(currentExpression + digit);
};

/**
 * Handles operator input with smart spacing.
 * @param operator - The operator to add
 */
const handleOperatorInput = (operator: string): void => {
  const currentExpression = calculatorState.expression.get();

  if (currentExpression === "") return;

  // Replace the last operator if one was just entered
  const lastChar = currentExpression.slice(-1);
  if (["+", "−", "×", "÷"].includes(lastChar)) {
    calculatorState.expression.set(currentExpression.slice(0, -1) + operator);
  } else {
    calculatorState.expression.set(currentExpression + operator);
  }
};

/**
 * Performs calculation and updates the display.
 */
const calculateResult = (): void => {
  const expression = calculatorState.expression.get();

  if (!expression || expression.trim() === "") {
    return;
  }

  try {
    const result = safelyEvaluateExpression(expression);
    const formattedResult = formatDisplayNumber(result);

    // Update state
    calculatorState.result.set(formattedResult);

    // Add to history
    const currentHistory = calculatorState.history.get();
    const newHistory = [
      ...currentHistory,
      `${expression} = ${formattedResult}`,
    ];
    calculatorState.history.set(newHistory);
    calculatorState.historyIndex.set(newHistory.length);

    // Reset expression for next calculation
    calculatorState.expression.set(formattedResult);
  } catch (error) {
    calculatorState.result.set("Error");
    calculatorState.expression.set("");
  }
};

/**
 * Clears the calculator state.
 */
const clearCalculator = (): void => {
  calculatorState.expression.set("");
  calculatorState.result.set("0");
  calculatorState.isError.set(false);
  calculatorState.isSuccess.set(false);
};

/**
 * Handles backspace operation.
 */
const handleBackspace = (): void => {
  const currentExpression = calculatorState.expression.get();
  calculatorState.expression.set(currentExpression.slice(0, -1));

  if (calculatorState.expression.get() === "") {
    calculatorState.result.set("0");
  }
};

/**
 * Applies mathematical functions to the current result.
 * @param functionName - Name of the function to apply
 */
const applyMathFunction = (functionName: string): void => {
  const currentValue = calculatorState.result.get();
  const numericValue = parseFloat(currentValue);

  if (isNaN(numericValue)) return;

  try {
    const func = MATH_FUNCTIONS[functionName as keyof typeof MATH_FUNCTIONS];
    if (func) {
      const result = func(numericValue);
      const formattedResult = formatDisplayNumber(result);
      calculatorState.result.set(formattedResult);
      calculatorState.expression.set(formattedResult);
    }
  } catch (error) {
    calculatorState.result.set("Error");
  }
};

/**
 * Handles memory operations.
 * @param operation - Memory operation to perform
 */
const handleMemoryOperation = (operation: string): void => {
  const currentValue = parseFloat(calculatorState.result.get());
  const currentMemory = calculatorState.memory.get();

  switch (operation) {
    case "MC":
      calculatorState.memory.set(0);
      break;
    case "MR":
      if (currentMemory !== 0) {
        calculatorState.expression.set(currentMemory.toString());
        calculatorState.result.set(formatDisplayNumber(currentMemory));
      }
      break;
    case "M+":
      if (!isNaN(currentValue)) {
        calculatorState.memory.set(currentMemory + currentValue);
      }
      break;
    case "M-":
      if (!isNaN(currentValue)) {
        calculatorState.memory.set(currentMemory - currentValue);
      }
      break;
  }
};

/**
 * Handles history navigation.
 * @param direction - "up" or "down"
 */
const navigateHistory = (direction: "up" | "down"): void => {
  const history = calculatorState.history.get();
  const currentIndex = calculatorState.historyIndex.get();

  if (direction === "up" && currentIndex > 0) {
    const newIndex = currentIndex - 1;
    calculatorState.historyIndex.set(newIndex);
    const historyItem = history[newIndex];
    const expression = historyItem.split(" = ")[0];
    calculatorState.expression.set(expression);
  } else if (direction === "down" && currentIndex < history.length - 1) {
    const newIndex = currentIndex + 1;
    calculatorState.historyIndex.set(newIndex);
    const historyItem = history[newIndex];
    const expression = historyItem.split(" = ")[0];
    calculatorState.expression.set(expression);
  }
};

/*****************************************************************************
 * Widget creation functions
 *****************************************************************************/

/**
 * Creates the calculator display.
 * @returns Widget containing the display area
 */
const createCalculatorDisplay = () => {
  const expressionDisplay = Widget.Label({
    cssClasses: [CSS_CLASSES.expression],
    label: bind(calculatorState.expression).as((expr) => expr || "0"),
    halign: Gtk.Align.END,
    selectable: true,
    ellipsize: Pango.EllipsizeMode.END,
  });

  const resultDisplay = Widget.Label({
    cssClasses: [CSS_CLASSES.result],
    label: bind(calculatorState.result),
    halign: Gtk.Align.END,
    selectable: true,
    ellipsize: Pango.EllipsizeMode.END,
  });

  const memoryIndicator = Widget.Label({
    cssClasses: [CSS_CLASSES.memoryIndicator],
    label: bind(calculatorState.memory).as((mem) => (mem !== 0 ? "M" : "")),
    halign: Gtk.Align.START,
  });

  const historyIndicator = Widget.Label({
    cssClasses: [CSS_CLASSES.historyIndicator],
    label: bind(calculatorState.history).as((hist) =>
      hist.length > 0 ? "*" : "",
    ),
    halign: Gtk.Align.START,
  });

  const indicatorsBox = Widget.Box({
    hexpand: true,
    children: [memoryIndicator, historyIndicator],
  });

  return Widget.Box({
    cssClasses: [CSS_CLASSES.displayContainer],
    vertical: true,
    children: [indicatorsBox, expressionDisplay, resultDisplay],
    setup: (self) => {
      // Add dynamic CSS classes based on state
      bind(calculatorState.isError).subscribe((isError) => {
        if (isError) {
          self.add_css_class(CSS_CLASSES.errorState);
        } else {
          self.remove_css_class(CSS_CLASSES.errorState);
        }
      });

      bind(calculatorState.isSuccess).subscribe((isSuccess) => {
        if (isSuccess) {
          self.add_css_class(CSS_CLASSES.successState);
        } else {
          self.remove_css_class(CSS_CLASSES.successState);
        }
      });
    },
  });
};

/**
 * Creates a single calculator button.
 * @param config - Button configuration
 * @returns Configured button widget
 */
const createCalculatorButton = (config: ButtonConfig) => {
  const getCssClasses = (): string[] => {
    const classes: string[] = [CSS_CLASSES.button];

    switch (config.type) {
      case "number":
        classes.push(CSS_CLASSES.buttonNumber);
        break;
      case "operator":
        classes.push(CSS_CLASSES.buttonOperator);
        break;
      case "function":
        classes.push(CSS_CLASSES.buttonFunction);
        break;
      case "equals":
        classes.push(CSS_CLASSES.buttonEquals);
        break;
      case "clear":
        classes.push(CSS_CLASSES.buttonClear);
        break;
      case "special":
        classes.push(CSS_CLASSES.buttonSpecial);
        break;
      case "memory":
        classes.push(CSS_CLASSES.buttonFunction);
        break;
    }

    return classes;
  };

  const handleButtonAction = (): void => {
    switch (config.type) {
      case "number":
        handleNumberInput(config.text);
        break;
      case "operator":
        handleOperatorInput(config.action || config.text);
        break;
      case "equals":
        calculateResult();
        break;
      case "clear":
        clearCalculator();
        break;
      case "special":
        if (config.action === "backspace") {
          handleBackspace();
        }
        break;
      case "function":
        if (config.action) {
          applyMathFunction(config.action);
        }
        break;
      case "memory":
        handleMemoryOperation(config.text);
        break;
    }
  };

  return Widget.Button({
    cssClasses: getCssClasses(),
    cursor: Gdk.Cursor.new_from_name("pointer", null),
    child: Widget.Label({
      label: config.text,
    }),
    onButtonPressed: handleButtonAction,
  });
};

/**
 * Creates the calculator button grid.
 * @returns Widget containing the button grid
 */
const createButtonGrid = () => {
  const grid = new Gtk.Grid({
    cssClasses: [CSS_CLASSES.buttonGrid],
    columnSpacing: 8,
    rowSpacing: 8,
    columnHomogeneous: true,
    rowHomogeneous: true,
  });

  BUTTON_LAYOUT.forEach((row, rowIndex) => {
    let columnIndex = 0;

    row.forEach((buttonConfig) => {
      const button = createCalculatorButton(buttonConfig);
      const span = buttonConfig.span || 1;

      grid.attach(button, columnIndex, rowIndex, span, 1);
      columnIndex += span;
    });
  });

  return grid;
};

/**
 * Sets up global keyboard shortcuts.
 * @param widget - Main calculator widget
 */
const setupKeyboardShortcuts = (widget: any): void => {
  const keyController = new Gtk.EventControllerKey();

  keyController.connect(
    "key-pressed",
    (_controller, keyval, _keycode, _state) => {
      // Number keys
      if (keyval >= Gdk.KEY_0 && keyval <= Gdk.KEY_9) {
        const digit = String.fromCharCode(keyval);
        handleNumberInput(digit);
        return true;
      }

      // Keypad numbers
      if (keyval >= Gdk.KEY_KP_0 && keyval <= Gdk.KEY_KP_9) {
        const digit = (keyval - Gdk.KEY_KP_0).toString();
        handleNumberInput(digit);
        return true;
      }

      // Shortcuts
      const shortcut =
        KEYBOARD_SHORTCUTS[keyval as keyof typeof KEYBOARD_SHORTCUTS];

      if (shortcut) {
        switch (shortcut) {
          case "=":
            calculateResult();
            break;
          case "clear":
            clearCalculator();
            break;
          case "backspace":
            handleBackspace();
            break;
          case "history_up":
            navigateHistory("up");
            break;
          case "history_down":
            navigateHistory("down");
            break;
          default:
            if (["+", "-", "*", "/"].includes(shortcut)) {
              const displayOperator =
                shortcut === "*"
                  ? "×"
                  : shortcut === "/"
                    ? "÷"
                    : shortcut === "-"
                      ? "−"
                      : shortcut;
              handleOperatorInput(displayOperator);
            } else {
              handleNumberInput(shortcut);
            }
        }
        return true;
      }

      return false;
    },
  );

  widget.add_controller(keyController);
};

/*****************************************************************************
 * Main component
 *****************************************************************************/

/**
 * Create calculator.
 * @returns A calculator. (Surprise.)
 */
export default () => {
  const display = createCalculatorDisplay();
  const buttonGrid = createButtonGrid();

  const calculatorWidget = Widget.Box({
    cssClasses: [CSS_CLASSES.calculator],
    orientation: Gtk.Orientation.VERTICAL,
    hexpand: true,
    vexpand: false,
    spacing: 16,
    children: [display, buttonGrid],
    setup: (self) => {
      setupKeyboardShortcuts(self);

      self.canFocus = true;
      self.focusable = true;

      // Auto-focus when created
      GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
        self.grab_focus();
        return false;
      });
    },
  });

  return calculatorWidget;
};
