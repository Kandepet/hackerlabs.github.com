---
date: '2011-06-16 17:01:44'
layout: post
slug: gods-number-is-20-mine-is-67-2
status: publish
title: God's number is 20, mine is 67.
wordpress_id: '23'
comments: true
categories:
- Hobby
- Puzzles
- Rubiks cube
keywords: "rubik's cube solution, rubik's cube, God's number, Deepak Kandepet, Kandepet"
description: "Steps to solve the rubik's cube. Without using magic or trickery, God would need utmost 20 moves to solve any scrambled 3 x 3 x 3 Rubiks cube. The best I can do is in 67 moves."
---

> Without using magic or trickery, God would need utmost [20](http://cube20.org/) moves to solve any scrambled 3 x 3 x 3 Rubik's cube. The best I can do is in 67 moves.



I got my first Rubik's cube when I was 11 years old. After years of trying to solve it, my greatest accomplishment was solving 2 adjacent faces. I would give up trying to solve the entire cube after fiddling with it for hours. I was still proud of what I could solve though; every one else I knew could not even solve 1 face.

God's number is the smallest number of moves it takes to solve a general Rubik's cube. In the case of the familiar 3x3x3 cube it was proved that 20 moves are always enough to solve even the hardest scramble. Finding this result took 35 years of computer time for researchers in Google. We still don't know the size of God's number for any cube other than the standard 3x3x3 but we do now know how it varies with the size of the cube. The remarkable thing is that it gets easier as the cube gets bigger.

There is now an answer to this question in a [paper](http://arxiv.org/abs/1106.5736) to be presented at the 19th Annual European Symposium on Algorithms.

This paper shows that using a dumb approach to solving a nxnxn problem is to perform a set of moves that places a single sub-cube in its correct position and repeat until all the faces are complete. This gives an upper bound of order n^2. However, it is well known that you can usually do better by using moves that place multiple sub-cubes into their correct location. These heuristics have now been made formal and this resulted in order n^2/logn being the new upper bound. Now this has also been shown to be the lower bound in the same paper. What this means is that the smallest number of moves required to solve the nxnxn Rubik's cube is proportional to n^2/log(n). Notice that this result doesn't tell us God's Number for a cube of any size, only that it is proportional to n^2/log(n).



## A simple algorithm to solve Rubik's cube


Over the past couple of months, my interest in the cube was piqued again while I was reading an article on [Group theory and Rubik's cube](http://www.math.harvard.edu/~jjchen/docs/Group%20Theory%20and%20the%20Rubik%27s%20Cube.pdf). I finally decided to understand the cube and figure out how to solve it. I was not interested in finding the fastest or most optimal solution, but a simple solution that I could remember.

![Names for six sides of cube, Up (U), Down (D), Right (R), Left (L), Front (F), Back (B) ](/io/wp-content/themes/cleanr/images/Rubiks/Sides.jpg)

This figure shows the labels we will be using when referring to the sides of the cube. We'll use the one-letter abbreviations shown (U, D, F, B, L, R) in the algorithm below.

A move is a twist (quarter turn) of one of the faces of cube in the clockwise direction. The letter "i" means inverse, or counter-clockwise twists.



Hints:




  * Before you start each move, make sure your thumbs are on the F side of the cube to ensure consistent orientation for all the sequences.


  * To turn a face in the right direction, imagine that you are facing that side of the cube before making the turn.


  * If you mess up along the way, just restart from Step 1.



Lets start with a color to solve, say orange:



#### STEP 1: Solve the Upper Orange Cross


To solve the orange cross, you have to solve the orange edge pieces on their own. If you have an edge piece in the correct place but flipped the wrong way, hold the cube with the piece in the upper-right position as in the diagram, and do the sequence Ri U Fi Ui to flip that piece only.














Before






**Ri U Fi Ui**











After











#### STEP 2: Solve the Orange Corners


Find a corner piece in the bottom layer that belongs on top. Turn the bottom layer until the piece is directly below its home in the top layer. Hold the cube with the piece on the lower-front-right and its home at the upper-front-right and then do the sequence Ri Di R D 1, 3, or 5 times until that corner is solved.
If you find a corner piece that's already in the top layer but the wrong spot or flipped the wrong way, hold the cube with the piece in the upper-front-right position and do Ri Di R D once. Now the piece is on the bottom and ready to be solved using the Ri Di R D sequence.














Before






**Ri Di R D
(x1, 3 or 5)**











After











#### STEP 3: Solve the Middle Layer Edges


Flip the cube so orange is on the bottom. Find the white-green edge piece. If it's on top, turn it so it matches one of the diagrams below. Then do the corresponding sequence to solve it. If the white-green edge is somewhere in the middle layer but it's in the wrong place or flipped the wrong way, hold the cube so the edge is in the front-right position and do either sequence once: U R Ui Ri Ui Fi U F or Ui Fi U F U R Ui Ri (This may require that you rotate the cube to a new face). After the move, the piece is in the top layer and you can solve it as described above. Repeat for the other 3 middle-layer edges.
















Before








**U R Ui Ri Ui Fi U F**











After















Before






**Ui Fi U F U R Ui Ri**









#### STEP 4: Solve the Upper Red Cross


Turn the top layer until the edges match one of the diagrams. Repeat the following sequence as many times as it takes to get a red cross: F R U Ri Ui Fi.



















Before






**F R U Ri Ui Fi**









After















Before














Before











#### STEP 5: Solve to Top Edges


Hold the cube with white in front. Turn the top layer until the red and white edge piece is solved as in the diagram, and then repeat the following sequence until the green and red edge piece is also solved on the right side: R U Ri U R U U Ri. Now turn the whole cube so that blue is the front face. If the top blue edge isn't solved, do the sequence again followed by an extra U.



















Before






Shorthand: **R U Ri U R U U Ri**











After











#### STEP 6: Solve the Top Corners


In this step, you'll get all of the corner pieces in the top layer into their correct positions. One or more of them may be twisted the wrong way, but we'll take care of that in the last step. The only thing to worry about here is to make sure that each of the corner pieces is in the right place.

Find a corner piece that's in the right place and hold the cube with that piece above your right thumb. Don't turn the top layer at all, as it well mess up all the effort from Step 5. Do the following sequence once or twice to put the rest of the corners into place: U R Ui Li U Ri Ui L. If you can't find a corner piece in the right place, just do the sequence once before you start.



















Before






**U R Ui Li U Ri Ui L**











After











#### STEP 7: Solve the Top Corners (Again)


This is it, the final step in solving the puzzle! This step is just a little bit tricky, so it is important to follow the directions carefully, or you'll lose all your hard work and have to start over.

Keeping the unsolved layer on top, rotate the cube until you find a corner piece that needs to be flipped (i.e., top color does not match top layer). Position that corner in the upper-front-right corner. From now on, you need to keep the cube in this orientation. Remember the color of the front center piece, and make sure to keep that piece in the front position from now on.

Do the sequence Ri Di R D 2 or 4 times to orient the selected corner piece. The cube will get scrambled in the process, but don't worry.

Next, rotate the top layer clockwise, until you find another corner that needs to be flipped. Repeat the sequence until all the corners are oriented properly.



















Before






**Ri Di R D**
(x2 or 4)











After










Congratulations, your cube is solved.


### Sources


The Java applet used to illustrate the moves in this project was written by Karl Hšrnell, Lars Petrus, and Matthew Smith. It can be obtained from: [http://lar5.com/cube/downloads.html](http://lar5.com/cube/downloads.html).
