Bellow are shown little tests showing how things perform
* filesize
* hot-reloading speed


---
1st test (10.03.2019)

* No uglify, no html-minify
  - loading time: 5.2 seconds
  - file size: 1.45 mb
* With uglify, no html-minify
  - loading time: 15.5 seconds --> uglify slows down hot reload
  - file size: 666 kb --> 45% --> half the size

* With html-minify
  - file size: 662 kb --> isn't worth it
