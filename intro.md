I've done a bunch of proof of concepts so far, and ran into lots of small challenges
it seems like using typescript with strict typing, and strong linting as well has been the most flexible and shareable tech stack
there's a game jam going on, so started exploring

I had seen some interesting drone videos, fpv
about the war in Ukraine
The idea for a CTF approximation of drone warfare might make for a compelling game. Potentially a training tool tbh. There's a lot of "modern warfare" type games out there with large followings. This felt like it could fit in that niche.

I then found a bunch of videos of fpv racing, acrobatics, and absolutely wild and free expression through 3d movement so I tried to play a real simulator. It was challenging to learn the realistic controls. DRL even has 3 different game modes to help ease a newbie into the game. 1st person vs 3rd person. Locked angles. Hover assist.

So I tried to make a dronesim with threejs
The controls were tricky to get mapped, the physics was awkward, the rendering had all sorts of issues
I tried all sorts of strategies, like BDD, TDD, extracting constants to use for control mapping. Integration and system tests. Aggressive logging to allow the agent partner to understand what was happening, hopefully provide useful insights into what was happening so we could more efficiently handle bugs
I tried creating flight routines to run in the game to spot test physics
I learned about quaternions as a potentially more clear way to handle relative positions
I learned about client/server dyanmics for multiplayer
All of this came after I attempted to make a doom clone, which got to the point of being vaguely able to parse a wad file, but never got to actually rendering the real maps, let alone all the more core game mechanics

After these experiments, I joined up with a few other game jammers to try and vibecode a netrunner inspired game.
I tried godot, I tried pure python, I eventually went back to simple javascript and console. We were able to build a basic card game like netrunner that could be played in the console. Not an amazing game loop, but basic mechanics were in place.
I tried to add a new drone game to it based on what I learned from the first experiments. Patterns that helped the dev loop and gameplay loop
I was able to get a semi-stable multiplayer game to render multiple players with their color and position and rotation properly displayed on the other client. But then the implementation drifted and kept breaking. It was incredibly frustrating.
I was never able to get a more complex map to render across clients.

Now I'm starting to think that maybe the drone game is too complex. The flying mechanics are hard to get right, and even if they were realistic, that's really hard to learn. I'm still trying hard to learn in a Drone Racing League simulator.

So now we have a janky game. The card game side of it is really messy. The drone game is fragile, and not yet fun.

We still need content for the card game, and some kind of simple open world to navigate. The drone idea is still interesting, but we need a simpler control scheme, probably skip the FPV, and instead focus on telling the drone where to go on a 2d board with some isometric view, keep it closer to a table top game, that way we can skip physics

It would be nice to get the card game to be more integrated into the window rendering. Like render the game state, accepting commands from the console is still in flavor for a netrunner type game, but it's hard to keep track of the game state from the console.

So rather than keep trying to clean up the buggy repo with a lot of failed attempts cooked in, it seemed like a good idea to start from scratch and try to speedrun back to that feature set.

Vibecoding flow can be really fun, but after a certain point on the spectrum from prototype to production, when regressions feel awful, and forward progress gets mired, it loses the joy of creativity.

I also tried to train up a neural network from scratch like alphazero to play a card game and use that as the AI in our netrunner game. Experiments were interesting, but fell off.

There's a lot of prototypes I've built, and I enjoyed all of them, now I'm unsure how to proceed. If I should start a new prototype of something related. Try something completely different and find that fun prototype spark again. One shot a new implementation of the existing game to try and built it again on stronger foundations. Unsure.