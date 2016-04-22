jsRPN
=====

jsRPN is a [RPN][1] calculator built with HTML and JavaScript. I've started this project to try out some techniques with the Prototype library. Thus, the feature set is incomplete and the styling of the UI only rudimentary. Nevertheless, the calculator is functional.

[1]: https://en.wikipedia.org/wiki/Reverse_Polish_notation "Reverse Polish notation"


Features
========

- use your thumb (on smart devices) or mouse to use the calculator
- control everything by using your keyboard
- uncommon operations like modulus (MOD), integer division (DIV), min-/maximum (min/max), rounding, random number generation (RAND)
- 10 registers to save your numbers

Key Bindings
------------

- <kbd>0</kbd>-<kbd>9</kbd>: enter digit
- <kbd>.</kbd> or <kbd>,</kbd>: enter decimal point
- <kbd>E</kbd>: enter exponent
- <kbd>S</kbd>: change sign
- <kbd>Enter</kbd>: enter/push
- <kbd>Backspace</kbd>: delete last input character
- <kbd>↑</kbd>: swap X and Y
- <kbd>↓</kbd>: drop X
- <kbd>Space</kbd>: enter command mode (see below)
- <kbd>+</kbd>, <kbd>-</kbd>, <kbd>*</kbd>, <kbd>/</kbd>: basic arithmetic operations
- <kbd>²</kbd>, <kbd>³</kbd>: square, cube
- <kbd>%</kbd>: percentage
- <kbd>^</kbd>: power

Command Mode
------------

To access advanced arithmetic functions and constants just start typing their name. If the desired name starts with a key from above then use `Space` to enter the command mode. Available names include: `abs`, `acos`, `add`, `asin`, `atan2`, `atan`, `binomial`, `ceil`, `cos`, `cube`, `cuberoot`, `div`, `divide`, `E`, `exp10`, `exp`, `faculty`, `floor`, `frac`, `LN10`, `LN2`, `log10`, `LOG10E`, `LOG2E`, `log`, `max`, `min`, `mod`, `multiply`, `percentage`, `PI`, `pow`, `random`, `reciprocal`, `root`, `round`, `sin`, `SQRT1_2`, `SQRT2`, `sqrt`, `square`, `subtract`, `tan`


Yet to come
-----------

- more functions (e.g. hyperbolic functions, number theoretic functions)
- arbitrary precision floating-point arithmetic
- large integers with efficient operation (power, multiplication, modulus,…)
- multiple base modes (OCT, DEC, HEX)
- select angle mode (radian, degree, grad, hour angle)
- common constants and unit conversion
- functional status line
- a nice UI styling

