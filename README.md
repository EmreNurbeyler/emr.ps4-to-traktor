# emr.ps4-to-traktor

A Max/MSP patch to use Traktor Pro software with a DualShock 4 Controller (or any other if you modify it accordingly). Should also work with a DualShock 5, although I've never tested it.

The whole system works by dividing the controls into 4 different banks, which can be accessed through holding the shoulder buttons.

I recommend using the Traktor Mixer interface, where software mixing and crossfading is possible. Don't forget to backup your Traktor profile and load my xbox.tsi profile! If you would like to edit the profile I'd recommend the awesome cmdr app: <https://cmdr-editor.github.io/cmdr/>

### |-- BANKS --|

nothing - Control Deck A\
hold R1 - Control Deck B\
hold L1 - Browser\
hold both - Mixer

Left and Right sticks are used like an old iPod clickwheel, where you rotate it in a circle to go up and down.

### |-- DECK CONTROLS --|

Button X - Play\
Button O - Set Loop\
Button Triangle - Set as BPM Master\
Button Square - Set as BPM Sync

Dpad Left   - Beat Jump\
Dpad Right - Beat Jump

Trigger Left (L2)    - Loop Size Change\
Trigger Right (R2) - Loop Size Change

Left Stick - Move through the track\
Right Stick - Move the loop

Touchpad is divided into three equal parts for three Hotcue buttons:\
[ Hotcue 1 | Hotcue 2 | Hotcue 3 ]

### |-- BROWSER CONTROLS --|

Right Stick - Move through the collection\
Dpad Up & Down - Precise control\
Dpad Left -   Load track to left deck\
Dpad Right - Load track to right deck

### |-- MIXER CONTROLS --|

Dpad Down - Sync the current crossfade value to the Right Stick\
Right Stick - Crossfade by moving the stick left or right\
Dpad Down (again) - Lock the position of crossfade