---
layout: default
title: "Sida Yuan"
description: A data scientist by trade and a mathematician by nature. This is where you can find my personal apps and writings on a variety of subjects.
permalink: /
---

# Welcome!

I'm a nerd who enjoys exploring various topics. I need a place to dump some of the stuff on my mind, and so here it is.

Highlights:
- [Bridging the gap: Extending the reflection principle via the Brownian bridge](/blog/bridging-the-gap-extending-the-reflection-principle-via-the-brownian-bridge/)
- [Market simulator game](/app/market_simulator/)

<br>

# Who am I?

<div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">

  <div style="flex: 1; padding-right: 20px;">
    <p>Hello!</p>
    <p>My name is <span style="color:#8B19FF">Sida Yuan</span> <span style="color:lightgrey">(he/him)</span></p>
    <p>I was born in China, grew up in New Zealand and I've been living in <span style="color:#8B19FF">Sydney</span> since 2009</p>

  </div>

  <div style="flex: 1;">
    <img src="{{ site.baseurl }}/assets/images/Sida in Lijiang.png" alt="Me in Lijiang 2024" style="max-width: 100%; width: auto;">
  </div>

</div>


I'm a <span style="color:#8B19FF">data scientist</span> by trade and a <span style="color:#8B19FF">mathematician</span> by nature.

I currently work at [Canva](https://www.canva.com/). <span style="color:lightgrey">It should go without saying that absolutely nothing on this website reflects the views of my past and present employers, institutions and colleagues. This is my <i>personal</i> space.</span>

I graduated with a Bachelor of Science (Advanced Mathematics) (Honours) from the University of Sydney in 2020
- Thesis: <i>Series Representations of Lévy Processes and Applications</i>
- Majors in Mathematics, Statistics
- Minors in Computer Science, Economics <span style="color:lightgrey">(omitted from my transcript to fit in the CS minor)</span>
- <details>
  <summary>19 academic awards</summary>
  <span style="color:lightgrey">Well, if you insist...</span>

  <ul>
    <li>University Medal</li>
    <li>KE Bullen Memorial Prize
      <ul>
        <li>Top student in Applied Mathematics Honours</li>
      </ul>
    </li>
    <li>MJ and M Ashby Prize
      <ul>
        <li>Best honours essay in the School of Mathematics and Statistics</li>
      </ul>
    </li>
    <li>Dean's List of Excellence in Academic Performance 2020</li>
    <li>Computer Science Undergraduate High Honour Roll</li>
    <li>George Allen Scholarship in Applied Mathematics</li>
    <li>University of Sydney Honours Scholarship</li>
    <li>Science Research Experience Scholarship 2019/20</li>
    <li>Dean's List of Excellence in Academic Performance 2019</li>
    <li>Academic Merit Prize 2018</li>
    <li>Denison Summer Research Scholarship 2018/19</li>
    <li>Dean's List of Excellence in Academic Performance 2018</li>
    <li>'Taste of Research' Summer Scholarship 2017/18
      <ul>
        <li>This one's for the University of New South Wales</li>
      </ul>
    </li>
    <li>Norbert Quirk Prize 2017
      <ul>
        <li>Essay: <i>Applications of Game Theory to Evolutionary Biology</i></li>
      </ul>
    </li>
    <li>Dean's List of Excellence in Academic Performance 2017</li>
    <li>Faculty of Science - Dean's Scholarship in Science</li>
    <li>Academic Merit Prize 2016</li>
    <li>Dean's List of Excellence in Academic Performance 2016</li>
    <li>Dean's Entry Scholarship in Faculty of Science</li>
  </ul></details>


During my time at university, I was conducting mathematics research in stochastic processes
- S. Yuan and R. Kawai. [Numerical aspects of shot noise representation of infinitely divisible laws and related processes](https://projecteuclid.org/journals/probability-surveys/volume-18/issue-none/Numerical-aspects-of-shot-noise-representation-of-infinitely-divisible-laws/10.1214/20-PS359.full), <i>Probability Surveys</i>, <b>18</b>, 2021.
- S. Yuan and R. Kawai. [Asymptotic degeneracy and subdiffusivity](https://iopscience.iop.org/article/10.1088/1751-8121/ab69a5), <i>Journal of Physics A: Mathematical and Theoretical</i>, <b>53</b>(9), 2020.

<br>

## Contact me

<p id="contact" style="text-align:center;"></p>

<p style="text-align:center;">

<input type="number" id="answer" placeholder="Your answer" style="width: 90px;">
<button id="submit">Submit</button>

</p>

<script type="text/javascript">
  var lim = 1 + Math.floor(Math.random() * 999);
  document.getElementById("contact").innerHTML = `$$\\int_{${-lim}}^{${lim}} 3(1 + x)\\,\\frac{dx}{3} = \\quad ?$$`
  var name1 = 'sida';
  var name2 = 'yuan97';
  var domain1 = "gm";
  var domain2 = 'ail';
  document.getElementById("submit").addEventListener("click", function(event) {
    event.preventDefault();
    var userAnswer = document.getElementById("answer").value;
    if (userAnswer == 2 * lim) {
        document.getElementById("contact").innerHTML = `<a href="mailto:' + name1 + '.' + name2 + '@' + domain1 + domain2 + '.com">` + name1 + '.' + name2 + '@' + domain1 + domain2 + '.com' + '</a>';
    }
  });
</script>

<script type="text/javascript" async
    src="https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.7/MathJax.js?config=TeX-MML-AM_CHTML">
</script>
