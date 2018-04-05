# Cornelica Notes

This file contains notes in regards to what is in the text files for the script of the game. Both in-game text and actions for the game to perform (such as character movement) are in the same files; we don't want to touch any lines involving actions as that could break the game engine logic.

Here's what we've been able to tell so far from the symbols that begin each line:

Symbol | Meaning
------ | -------
**@** | Denotes an action for the game engine. These are to be left alone.
**[ ]** | Lines starting with these brackets are displayed in dialog in the game, starting with the character name in brackets, followed by spoken text.
**/CL** | This appears to be a "Create Line" for text on the screen within a message box. The boxes are denoted with `@mes_win`
**;;** | Appears to be simple comments in the script.

## Item Descriptions

It appears that the character limit for item descriptions is **70** per line. New lines can be made by using `\n` to push text to a new line.

Text boxes have a limit of 40, including quotes, and flows to a new line after. If the limit of 80 is reached, it automatically continues through the dialog until everything is written.

## Text Colors

RPG Maker MV supports changing the text color via a text code.

**\C[x]** - `x` denotes the number between 0 through 10 to get a specific color for the text box.

Number | Color
------ | -----
**0** | ![Black](https://placehold.it/15/000000/000000?text=+) `Black`
**1** | ![Blue](https://placehold.it/15/0000FF/000000?text=+) `Blue`
**2** | ![Red](https://placehold.it/15/FF0000/000000?text=+) `Red`
**3** | ![Green](https://placehold.it/15/00FF00/000000?text=+) `Green`
**4** | ![Light Blue](https://placehold.it/15/ADD8E6/000000?text=+) `Light Blue`
**5** | ![Light Purple](https://placehold.it/15/D8BFD8/000000?text=+) `Light Purple`
**6** | ![Orange](https://placehold.it/15/FFA500/000000?text=+) `Orange`
**7** | ![Gray](https://placehold.it/15/808080/000000?text=+) `Gray`
**8** | ![Purple](https://placehold.it/15/800080/000000?text=+) `Purple`
**9** | ![Dark Blue](https://placehold.it/15/00008B/000000?text=+) `Dark Blue`
**10** | ![Maroon](https://placehold.it/15/800000/000000?text=+) `Maroon`