convert -crop 1024x1024 Skybox.png Skybox-%d.jpg

mogrify -rotate "-90" Skybox-0.jpg
mogrify -rotate "90" Skybox-2.jpg

mogrify -rotate "180" Skybox-1.jpg
mogrify -rotate "0" Skybox-3.jpg
