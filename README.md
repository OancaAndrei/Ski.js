# Ski.js
An arcade ski game with realtime motion capture and gestures.

## About
This is a *Three.js* game that can be controlled either by using the *WASD-keys* (for player one) and the *arrow-keys* (for player two), or by using a webcam and body gestures.

The goal is to reach the finish line first (duh). Don't expect fancy celebrations once you win though.

For motion capture the game uses the [PoseNet](https://github.com/tensorflow/tfjs-models/tree/master/posenet) model.\
For gesture recognition the game uses my other project named [Poser.js](https://github.com/OancaAndrei/Poser.js).

## Levels
While the 3D models of the two snowmen, the trees and the boulders have been modeled in *Blender*, the world surface gets generated on the spot.

Instead of having to handle *complex* world models I opted for an easier solution, which in turn made possible the creation of a simple level-editor.\
The magic word is heighmap. The surface gets generated from a 64x64 PNG texture carefully crafted.

The first step was drawing the track like this ![Track](/levels/alpha.png). By mapping high points to dark pixels and the low points to white pixels, the idea is to displace the vertices of this big-flat-grid plane according to the color of the track texture. This results with a caved plane, that's still not quite what's needed. Next step is to add some inclination, to get that mountain feeling.
![Inclination](/levels/heightmap.png).\
Because a color channel of a PNG image can hold values from 0 to 255 (8 bit channels), the resulting inclination wasn't satisfying, so an extra layer has been used, which adds also some jumps to make the race more interesting.\
As previously mentioned, all this black and white maps are merged in a single image, using the RGB channels of the PNG image, resulting with the following ![Final level](/levels/map_jump.png).\
The following is the same level without the jumps layer, for comparison: ![Final level](/levels/map.png).

Base track:\
![Track](/gifs/anim0.gif)

With inclination:\
![With inclination](/gifs/anim1.gif)

With jumps:\
![With jumps](/gifs/anim2.gif)

Textured:\
![Textured](/gifs/anim3.gif)

## Screenshots
I guess some screenshots are due.

![Screenshot 0](/screenshots/screen0.png)

![Screenshot 1](/screenshots/screen1.png)

![Screenshot 2](/screenshots/screen2.png)

![Screenshot 3](/screenshots/screen3.png)

![Screenshot 4](/screenshots/screen4.png)
